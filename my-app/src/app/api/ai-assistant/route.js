/**
 * C.A.S.T API Route
 * LangChain-based assistant orchestration with retrieval, citations, tools, and memory.
 */

import { withOptionalAuth } from '@/lib/middleware/withAuth';
import connectDB from '@/lib/config/database.js';
import { success, error } from '@/lib/utils/apiResponse.js';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rateLimit.js';

import { buildAssistantSystemPrompt } from '@/lib/services/ai/systemPrompt';
import { classifyIntent, INTENTS } from '@/lib/services/ai/intentClassifier';
import { buildContext } from '@/lib/services/ai/contextBuilder';
import { runAssistantChain } from '@/lib/services/ai/assistantChain';
import { runAssistantAgent } from '@/lib/services/ai/agentOrchestrator';
import { createAssistantMemory, saveAssistantTurn } from '@/lib/services/ai/memoryStore';
import { getSpoilerResponseMode, generateSpoilerWarning, SPOILER_INSTRUCTIONS } from '@/lib/services/ai/spoilerHandler';
import { checkContentSafety, getUnsafeContentResponse, checkResponseSafety } from '@/lib/services/ai/contentSafety';

function getOutOfDomainResponse() {
  return "I'm C.A.S.T, your cinematic assistant! I specialize in movies, TV shows, and everything entertainment-related on Cinnect. Is there something about films, shows, or our platform I can help you with?";
}

function getGreetingResponse(username = null) {
  const greetings = [
    `Hey${username ? ` ${username}` : ''}! I'm C.A.S.T, your cinematic companion. What are we watching today?`,
    `Hello${username ? ` ${username}` : ''}! Ready to discover something amazing to watch?`,
    `Hi there${username ? ` ${username}` : ''}! I'm here to help you find your next favorite movie or show. What are you in the mood for?`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getUserContext(user) {
  if (!user) return null;
  return {
    username: user.username,
    level: user.level,
    favoriteGenres: user.favoriteGenres
  };
}

function shouldUseAgent(classification) {
  return classification.intent === INTENTS.ACTION || classification.shouldUseTmdbTools;
}

function appendMemorySummary(systemPrompt, memorySummary) {
  const summary = memorySummary?.trim();
  if (!summary) return systemPrompt;

  return `${systemPrompt}\n\n## CONVERSATION MEMORY\n${summary}`;
}

async function handler(request, context) {
  const rateLimitResult = checkRateLimit(request, 'ai-assistant', RATE_LIMITS.AI);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    await connectDB();

    const {
      message,
      conversationHistory = [],
      conversationId = 'default'
    } = await request.json();
    const user = context?.user || null;
    const userId = user?._id?.toString() || null;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return error('Message is required', 400);
    }

    if (message.length > 2000) {
      return error('Message is too long. Please keep it under 2000 characters.', 400);
    }

    const safetyCheck = await checkContentSafety(message);

    if (!safetyCheck.isSafe) {
      return success({
        message: getUnsafeContentResponse(safetyCheck),
        blocked: true,
        intent: 'safety_violation',
        citations: []
      });
    }

    const classification = await classifyIntent(message, conversationHistory);

    if (classification.intent === INTENTS.OUT_OF_DOMAIN) {
      return success({
        message: getOutOfDomainResponse(),
        intent: classification.intent,
        citations: []
      });
    }

    if (classification.intent === INTENTS.GREETING) {
      return success({
        message: getGreetingResponse(user?.username),
        intent: classification.intent,
        citations: []
      });
    }

    const spoilerMode = getSpoilerResponseMode(message, conversationHistory);
    const [contextData, memoryState] = await Promise.all([
      buildContext(classification, userId, message),
      createAssistantMemory({ userId, conversationId, conversationHistory })
    ]);
    const systemPrompt = appendMemorySummary(
      `${buildAssistantSystemPrompt(classification, spoilerMode, getUserContext(user))}\n\n${SPOILER_INSTRUCTIONS}`,
      memoryState.summary
    );

    let assistantResult;

    if (shouldUseAgent(classification)) {
      assistantResult = await runAssistantAgent({
        message,
        userId,
        systemPrompt,
        contextData,
        classification,
        chatHistoryMessages: memoryState.chatHistoryMessages
      });
    } else {
      assistantResult = await runAssistantChain({
        message,
        systemPrompt,
        contextData,
        classification,
        shouldUseVectorSearch: classification.shouldUseVectorSearch,
        vectorNamespaces: classification.vectorNamespaces,
        chatHistoryMessages: memoryState.chatHistoryMessages
      });
    }

    let responseText = assistantResult.answer || '';

    if (spoilerMode.mode === 'ask_consent' &&
      classification.intent === INTENTS.EXPLANATION &&
      !responseText.toLowerCase().includes('spoiler')) {
      responseText = generateSpoilerWarning(classification.entities.mediaTitle);
    }

    const hasConsent = spoilerMode.mode === 'spoiler_allowed';
    const responseSafety = await checkResponseSafety(responseText, hasConsent);

    if (responseSafety.spoilerDetected && !hasConsent) {
      responseText = generateSpoilerWarning(classification.entities.mediaTitle);
    }

    if (!responseSafety.safe && !responseSafety.spoilerDetected) {
      responseText = "I apologize, but I couldn't generate an appropriate response. Could you rephrase your question?";
    }

    await saveAssistantTurn(memoryState, message, responseText);

    return success({
      message: responseText,
      intent: classification.intent,
      confidence: classification.confidence,
      citations: assistantResult.citations || []
    });
  } catch (err) {
    console.error('AI Assistant error:', err);

    return success({
      message: "I'm having trouble processing your request. Please try again in a moment!",
      intent: 'error',
      citations: []
    });
  }
}

export const POST = withOptionalAuth(handler);
