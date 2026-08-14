/**
 * Cinnect AI Assistant - Retrieval Chain
 * Centralizes structured context, reranked vector retrieval, citations, and prompt templating.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import {
  ASSISTANT_CHAIN_PROMPT,
  CITATION_INSTRUCTIONS,
  ROUTING_INSTRUCTIONS
} from './systemPrompt';
import { runRerankerCitationChain } from './rerankerChain';
import { langchainCache  } from './langchainCache';

let combineDocsChainPromise = null;

function getCombineDocsChain() {
  if (combineDocsChainPromise) return combineDocsChainPromise;

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-3.6-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
    maxOutputTokens: 1024,
    cache: langchainCache,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', ASSISTANT_CHAIN_PROMPT],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}']
  ]);

  combineDocsChainPromise = createStuffDocumentsChain({ llm, prompt });
  return combineDocsChainPromise;
}

export function toChatHistory(conversationHistory = []) {
  return conversationHistory
    .filter(msg => msg?.content?.trim())
    .map(msg => (msg.role === 'assistant'
      ? new AIMessage(msg.content)
      : new HumanMessage(msg.content)
    ));
}

export function serializeContextData(contextData) {
  if (contextData == null) return 'None.';
  if (typeof contextData === 'string') {
    const trimmed = contextData.trim();
    return trimmed.length ? trimmed : 'None.';
  }

  try {
    const json = JSON.stringify(contextData, null, 2);
    if (!json || json === '{}' || json === '[]') return 'None.';
    return json;
  } catch {
    return String(contextData);
  }
}

function coerceContextData(contextData) {
  return serializeContextData(contextData);
}

export async function runAssistantChain({
  message,
  conversationHistory,
  chatHistoryMessages,
  systemPrompt,
  contextData,
  shouldUseVectorSearch,
  vectorNamespaces
}) {
  const retrieval = await runRerankerCitationChain({
    query: message,
    namespaces: vectorNamespaces,
    enabled: Boolean(shouldUseVectorSearch),
    topK: process.env.RAG_RERANK_TOP_K || process.env.RAG_TOP_K
  });

  const combineDocsChain = await getCombineDocsChain();
  const result = await combineDocsChain.invoke({
    input: message,
    chat_history: chatHistoryMessages || toChatHistory(conversationHistory),
    system_prompt: systemPrompt,
    routing_instructions: ROUTING_INSTRUCTIONS,
    citation_instructions: CITATION_INSTRUCTIONS,
    context_data: coerceContextData(contextData),
    context: retrieval.documents
  });

  return {
    answer: result || '',
    context: retrieval.documents,
    citations: retrieval.citations
  };
}
