import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ChatMessageHistory, ConversationSummaryMemory } from 'langchain/memory';
import { getRedisClient } from '@/lib/config/redis';
import { langchainCache } from './langchainCache';

const MEMORY_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_STORED_MESSAGES = 20;
const MAX_PROMPT_MESSAGES = 10;

const localMemoryStore = new Map();

function getMemoryKey(userId, conversationId = 'default') {
  const owner = userId ? `user:${userId}` : `anonymous:${conversationId || 'default'}`;
  return `cast:memory:${owner}:${conversationId || 'default'}`;
}

function serializeMessage(message) {
  const type = message._getType?.() || message.getType?.();
  return {
    role: type === 'ai' ? 'assistant' : 'user',
    content: String(message.content || '')
  };
}

function deserializeMessage(message) {
  if (!message?.content?.trim()) return null;
  return message.role === 'assistant'
    ? new AIMessage(message.content)
    : new HumanMessage(message.content);
}

function normalizeClientHistory(conversationHistory = []) {
  return conversationHistory
    .filter(message => message?.content?.trim())
    .slice(-MAX_STORED_MESSAGES)
    .map(message => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content
    }));
}

function mergeHistory(storedMessages = [], clientMessages = []) {
  const merged = [...storedMessages, ...clientMessages];
  const seen = new Set();
  const deduped = [];

  for (const message of merged) {
    const key = `${message.role}:${message.content}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(message);
  }

  return deduped.slice(-MAX_STORED_MESSAGES);
}

async function readMemoryPayload(key) {
  const redis = getRedisClient();
  if (redis) {
    return await redis.get(key);
  }
  return localMemoryStore.get(key) || null;
}

async function writeMemoryPayload(key, payload) {
  const redis = getRedisClient();
  if (redis) {
    await redis.set(key, payload, { ex: MEMORY_TTL_SECONDS });
    return;
  }
  localMemoryStore.set(key, payload);
}

function getMemoryModel() {
  return new ChatGoogleGenerativeAI({
    model: process.env.MEMORY_MODEL || 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
    maxOutputTokens: 512,
    cache : langchainCache 
  });
}

export async function createAssistantMemory({
  userId,
  conversationId = 'default',
  conversationHistory = []
}) {
  const key = getMemoryKey(userId, conversationId);
  const persisted = await readMemoryPayload(key).catch((error) => {
    console.error('Failed to load assistant memory:', error);
    return null;
  });

  const messages = mergeHistory(
    Array.isArray(persisted?.messages) ? persisted.messages : [],
    normalizeClientHistory(conversationHistory)
  );
  const chatMessages = messages.map(deserializeMessage).filter(Boolean);
  const chatHistory = new ChatMessageHistory(chatMessages);
  const memory = new ConversationSummaryMemory({
    llm: getMemoryModel(),
    chatHistory,
    inputKey: 'input',
    outputKey: 'output',
    memoryKey: 'memory_summary'
  });

  memory.buffer = typeof persisted?.summary === 'string' ? persisted.summary : '';

  const promptMessages = chatMessages.slice(-MAX_PROMPT_MESSAGES);

  return {
    key,
    memory,
    chatHistoryMessages: promptMessages,
    summary: memory.buffer
  };
}

export async function saveAssistantTurn(memoryState, input, output) {
  if (!memoryState?.memory || !input?.trim() || !output?.trim()) return;

  try {
    await memoryState.memory.saveContext({ input }, { output });
  } catch (error) {
    console.error('Failed to summarize assistant memory:', error);
  }

  try {
    const messages = await memoryState.memory.chatHistory.getMessages();
    await writeMemoryPayload(memoryState.key, {
      summary: memoryState.memory.buffer || '',
      messages: messages.map(serializeMessage).slice(-MAX_STORED_MESSAGES),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to persist assistant memory:', error);
  }
}
