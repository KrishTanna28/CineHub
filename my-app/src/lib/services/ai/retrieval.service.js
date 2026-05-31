import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = process.env.PINECONE_INDEX || 'cinnect-rag';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const DEFAULT_EMBEDDING_DIMENSIONS = 3072;
const DEFAULT_TOP_K = 4;
const DEFAULT_MIN_SCORE = 0.45;
const CINNECT_NAMESPACES = ['communities', 'posts', 'reviews'];

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function toPositiveNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

function normalizeText(value) {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

async function embedQuery(query) {
  const apiKey = requireEnv(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY');
  const dimensions = toPositiveInt(process.env.EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_DIMENSIONS);
  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: normalizeText(query),
    config: {
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: dimensions
    }
  });

  const vector = response.embeddings?.[0]?.values || [];
  if (vector.length !== dimensions) {
    throw new Error(`Query embedding dimension mismatch: expected ${dimensions}, got ${vector.length}`);
  }

  return vector;
}

function getPineconeIndex() {
  const apiKey = requireEnv(process.env.PINECONE_API_KEY, 'PINECONE_API_KEY');
  const pinecone = new Pinecone({ apiKey });
  return pinecone.Index(INDEX_NAME);
}

function normalizeNamespaces(namespaces) {
  if (!Array.isArray(namespaces) || namespaces.length === 0) {
    return CINNECT_NAMESPACES;
  }

  const allowed = new Set(CINNECT_NAMESPACES);
  const filtered = namespaces.filter(namespace => allowed.has(namespace));
  return filtered.length ? filtered : CINNECT_NAMESPACES;
}

function formatMatch(namespace, match) {
  const metadata = match.metadata || {};
  const text = metadata.text || '';
  const { text: _text, ...cleanMetadata } = metadata;

  return {
    id: match.id,
    namespace,
    type: cleanMetadata.type || namespace.slice(0, -1),
    score: match.score || 0,
    text,
    url: cleanMetadata.url || null,
    metadata: cleanMetadata
  };
}

function canonicalizeAppLink(url) {
  const APP_BASE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://cinnect.vercel.app').replace(/\/$/, '')
  if (!url) return ''
  if (url.startsWith('/')) return `${APP_BASE_URL}${url}`

  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === 'cinnect.com' || host === 'www.cinnect.com' || host === 'cinnect.vercel.app' || host === 'www.cinnect.vercel.app') {
      return `${APP_BASE_URL}${u.pathname}${u.search}${u.hash}`
    }
    return url
  } catch {
    return url
  }
}

export async function retrieveCinnectContext(query, options = {}) {
  const topK = toPositiveInt(options.topK || process.env.RAG_TOP_K, DEFAULT_TOP_K);
  const minScore = toPositiveNumber(options.minScore || process.env.RAG_MIN_SCORE, DEFAULT_MIN_SCORE);
  const namespaces = normalizeNamespaces(options.namespaces);
  const vector = await embedQuery(query);
  const index = getPineconeIndex();

  const namespaceResults = await Promise.all(
    namespaces.map(async (namespace) => {
      const result = await index.namespace(namespace).query({
        topK,
        vector,
        includeMetadata: true
      });

      return (result.matches || [])
        .map(match => formatMatch(namespace, match))
        .filter(match => match.score >= minScore);
    })
  );

  return namespaceResults
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, topK * namespaces.length);
}

export function formatRetrievedContextForLLM(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return '';

  const lines = matches.map((match, index) => {
    const metadata = match.metadata || {};
    const label = metadata.name || metadata.title || metadata.communityName || match.id;
    const score = match.score.toFixed(3);
    const link = match.url ? `\nLink: ${canonicalizeAppLink(match.url)}` : '';
    return `${index + 1}. [${match.namespace}/${match.type}] ${label} (score ${score})
${match.text}${link}`;
  });

  return `\n--- CINNECT VECTOR CONTEXT ---\n${lines.join('\n\n')}`;
}
