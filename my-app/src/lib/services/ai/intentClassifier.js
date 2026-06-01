import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { INTENT_CLASSIFIER_TEMPLATE } from './systemPrompt';
import { initLangChainCache } from './langchainCache';

export const INTENTS = {
  DISCOVERY: 'discovery',
  PERSONALIZATION: 'personalization',
  INFORMATION: 'information',
  SUMMARY: 'summary',
  COMMUNITY: 'community',
  ACTION: 'action',
  GUIDANCE: 'guidance',
  TRENDING: 'trending',
  EXPLANATION: 'explanation',
  GREETING: 'greeting',
  OUT_OF_DOMAIN: 'out_of_domain'
};

export const ACTION_TYPES = {
  ADD_WATCHLIST: 'add_watchlist',
  REMOVE_WATCHLIST: 'remove_watchlist',
  ADD_FAVORITE: 'add_favorite',
  REMOVE_FAVORITE: 'remove_favorite',
  MARK_WATCHED: 'mark_watched',
  RATE: 'rate',
  WRITE_REVIEW: 'write_review',
  JOIN_COMMUNITY: 'join_community',
  FOLLOW_USER: 'follow_user'
};

const VALID_INTENTS = new Set(Object.values(INTENTS));
const VALID_ACTION_TYPES = new Set([...Object.values(ACTION_TYPES), null]);
const VALID_NAMESPACES = new Set(['communities', 'posts', 'reviews']);

export const intentPromptTemplate = PromptTemplate.fromTemplate(INTENT_CLASSIFIER_TEMPLATE);

let classifierChainPromise = null;

function getClassifierChain() {
  if (classifierChainPromise) return classifierChainPromise;

  initLangChainCache();

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
    maxOutputTokens: 512,
    json: true
  });

  classifierChainPromise = Promise.resolve(new LLMChain({
    llm,
    prompt: intentPromptTemplate,
    outputKey: 'text'
  }));

  return classifierChainPromise;
}

function parseJsonObject(text) {
  const content = typeof text === 'string' ? text : String(text || '');
  const trimmed = content.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Classifier did not return JSON');
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

function normalizeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function validateIntentClassification(raw) {
  const intent = VALID_INTENTS.has(raw?.intent) ? raw.intent : INTENTS.DISCOVERY;
  const actionType = VALID_ACTION_TYPES.has(raw?.actionType) ? raw.actionType : null;
  const rawEntities = raw?.entities || {};
  const vectorNamespaces = Array.isArray(raw?.vectorNamespaces)
    ? raw.vectorNamespaces.filter(namespace => VALID_NAMESPACES.has(namespace))
    : [];

  return {
    intent,
    confidence: Math.max(0, Math.min(1, Number(raw?.confidence) || 0.5)),
    entities: {
      mediaTitle: rawEntities.mediaTitle || null,
      mediaType: ['movie', 'tv', 'person'].includes(rawEntities.mediaType) ? rawEntities.mediaType : null,
      rating: normalizeNumber(rawEntities.rating),
      year: rawEntities.year ? String(rawEntities.year) : null,
      seasonNumber: normalizeNumber(rawEntities.seasonNumber),
      episodeNumber: normalizeNumber(rawEntities.episodeNumber),
      topic: rawEntities.topic || null
    },
    requiresSpoilerCare: Boolean(raw?.requiresSpoilerCare),
    requiresUserContext: Boolean(raw?.requiresUserContext),
    actionType,
    shouldUseVectorSearch: Boolean(raw?.shouldUseVectorSearch),
    vectorNamespaces: vectorNamespaces.length ? vectorNamespaces : ['communities', 'posts', 'reviews'],
    shouldUseTmdbTools: Boolean(raw?.shouldUseTmdbTools)
  };
}

function fallbackClassification() {
  return {
    intent: INTENTS.DISCOVERY,
    confidence: 0.3,
    entities: {
      mediaTitle: null,
      mediaType: null,
      rating: null,
      year: null,
      seasonNumber: null,
      episodeNumber: null,
      topic: null
    },
    requiresSpoilerCare: false,
    requiresUserContext: false,
    actionType: null,
    shouldUseVectorSearch: false,
    vectorNamespaces: ['communities', 'posts', 'reviews'],
    shouldUseTmdbTools: true
  };
}

function formatRecentHistory(conversationHistory = []) {
  return conversationHistory
    .slice(-4)
    .filter(item => item?.content?.trim())
    .map(item => `${item.role || 'user'}: ${item.content}`)
    .join('\n') || 'None';
}

export async function classifyIntent(message, conversationHistory = []) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');

    const chain = await getClassifierChain();
    const result = await chain.call({
      recent_history: formatRecentHistory(conversationHistory),
      message
    });

    return validateIntentClassification(parseJsonObject(result.text));
  } catch (error) {
    console.error('LangChain intent classification failed:', error);
    return fallbackClassification();
  }
}

export function generateIntentPrompt(message, conversationHistory = []) {
  return intentPromptTemplate.format({
    recent_history: formatRecentHistory(conversationHistory),
    message
  });
}
