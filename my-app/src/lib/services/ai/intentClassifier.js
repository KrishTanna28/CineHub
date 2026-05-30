import { GoogleGenAI } from '@google/genai';

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

const CLASSIFIER_PROMPT = `You classify messages for C.A.S.T, a movie/TV and Cinnect platform assistant.

Use semantic reasoning only. Do not classify by keyword matching.

Routing rules:
- Movie/show/person facts, exact title searches, details, casts, summaries, trending, popular, similar movies/shows, and recommendations from the global entertainment catalog should use TMDB tools.
- Cinnect community, post, discussion, fan opinion, user review, platform activity, and "what are people saying" questions should use vector search over Cinnect data.
- A query can use both TMDB tools and Cinnect vector search when the user asks for both official facts and community/review opinions.
- Out-of-domain means unrelated to movies, TV, entertainment, or Cinnect.

Return JSON only with this shape:
{
  "intent": "discovery|personalization|information|summary|community|action|guidance|trending|explanation|greeting|out_of_domain",
  "confidence": 0.0,
  "entities": {
    "mediaTitle": null,
    "mediaType": "movie|tv|person|null",
    "rating": null,
    "year": null,
    "seasonNumber": null,
    "episodeNumber": null,
    "topic": null
  },
  "actionType": "add_watchlist|remove_watchlist|add_favorite|remove_favorite|mark_watched|rate|write_review|join_community|follow_user|null",
  "requiresSpoilerCare": false,
  "requiresUserContext": false,
  "shouldUseVectorSearch": false,
  "vectorNamespaces": ["communities","posts","reviews"],
  "shouldUseTmdbTools": false
}`;

function extractText(result) {
  const parts = result.candidates?.[0]?.content?.parts || [];
  return parts
    .filter(part => typeof part.text === 'string')
    .map(part => part.text)
    .join('')
    .trim();
}

function parseJsonObject(text) {
  const trimmed = text.trim();
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

function normalizeClassification(raw) {
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

export async function classifyIntent(message, conversationHistory = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is required');

    const ai = new GoogleGenAI({ apiKey });
    const recentHistory = conversationHistory
      .slice(-4)
      .map(item => `${item.role || 'user'}: ${item.content || ''}`)
      .join('\n');

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${CLASSIFIER_PROMPT}

Recent conversation:
${recentHistory || 'None'}

User message:
${message}`
        }]
      }],
      config: {
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: 'application/json'
      }
    });

    return normalizeClassification(parseJsonObject(extractText(result)));
  } catch (error) {
    console.error('LLM intent classification failed:', error);
    return fallbackClassification();
  }
}

export function generateIntentPrompt(message) {
  return `${CLASSIFIER_PROMPT}

User message:
${message}`;
}
