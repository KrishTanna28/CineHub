import { randomUUID } from 'node:crypto';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

const INDEX_NAME = process.env.PINECONE_INDEX || 'cinnect-rag';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const DEFAULT_TOP_K = 4;
const DEFAULT_MIN_SCORE = 0.45;
const CINNECT_NAMESPACES = ['communities', 'posts', 'reviews'];

const vectorStoreCache = new Map();

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: EMBEDDING_MODEL,
});

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

function toNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getPineconeIndex() {
  const apiKey = requireEnv(process.env.PINECONE_API_KEY, 'PINECONE_API_KEY');
  const pinecone = new Pinecone({ apiKey });
  return pinecone.Index(INDEX_NAME);
}

async function getVectorStore(namespace) {
  if (vectorStoreCache.has(namespace)) {
    return vectorStoreCache.get(namespace);
  }

  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex: getPineconeIndex(),
      namespace,
    }
  );

  vectorStoreCache.set(namespace, vectorStore);
  return vectorStore;
}

function normalizeNamespaces(namespaces) {
  if (!Array.isArray(namespaces) || namespaces.length === 0) {
    return CINNECT_NAMESPACES;
  }

  const allowed = new Set(CINNECT_NAMESPACES);
  const filtered = namespaces.filter(namespace => allowed.has(namespace));
  return filtered.length ? filtered : CINNECT_NAMESPACES;
}

export function canonicalizeAppLink(url) {
  const appBaseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://cinnect.vercel.app').replace(/\/$/, '');
  if (!url) return '';
  if (url.startsWith('/')) return `${appBaseUrl}${url}`;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'cinnect.com' || host === 'www.cinnect.com' || host === 'cinnect.vercel.app' || host === 'www.cinnect.vercel.app') {
      return `${appBaseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return url;
  } catch {
    return url;
  }
}

function getDocumentUrl(metadata = {}) {
  return metadata.url || metadata.link || metadata.href || metadata.path || null;
}

function getDocumentType(namespace, metadata = {}) {
  return metadata.type || namespace.slice(0, -1);
}

function getDocumentId(namespace, doc, index) {
  return doc.metadata?.id || doc.metadata?._id || doc.metadata?.objectId || `${namespace}-${index}-${randomUUID()}`;
}

export async function retrieveCinnectRawDocuments(query, options = {}) {
  const topK = toPositiveInt(options.topK || process.env.RAG_TOP_K, DEFAULT_TOP_K);
  const fetchK = toPositiveInt(options.fetchK || topK, topK);
  const minScore = toNumberOrNull(options.minScore ?? process.env.RAG_MIN_SCORE) ?? DEFAULT_MIN_SCORE;
  const namespaces = normalizeNamespaces(options.namespaces);

  const namespaceResults = await Promise.all(
    namespaces.map(async (namespace) => {
      const vectorStore = await getVectorStore(namespace);
      const scoredDocs = await vectorStore.similaritySearchWithScore(query, fetchK);

      return scoredDocs
        .map(([document, score], index) => ({
          id: getDocumentId(namespace, document, index),
          namespace,
          type: getDocumentType(namespace, document.metadata),
          score,
          document,
          text: document.pageContent,
          url: canonicalizeAppLink(getDocumentUrl(document.metadata)),
          metadata: document.metadata || {},
        }))
        .filter(match => !Number.isFinite(minScore) || !Number.isFinite(match.score) || match.score >= minScore);
    })
  );

  return namespaceResults
    .flat()
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK * namespaces.length);
}

export async function retrieveCinnectContext(query, options = {}) {
  const matches = await retrieveCinnectRawDocuments(query, options);
  return matches.map(match => ({
    id: match.id,
    namespace: match.namespace,
    type: match.type,
    score: match.score,
    text: match.text,
    url: match.url,
    metadata: match.metadata,
    document: match.document,
  }));
}

export function formatRetrievedContextForLLM(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return '';

  const lines = matches.map((match, index) => {
    const metadata = match.metadata || {};
    const label = metadata.name || metadata.title || metadata.communityName || match.id;
    const score = Number.isFinite(match.score) ? match.score.toFixed(3) : 'n/a';
    const link = match.url ? `\nLink: ${canonicalizeAppLink(match.url)}` : '';
    return `${index + 1}. [${match.namespace}/${match.type}] ${label} (score ${score})
${match.text}${link}`;
  });

  return `\n--- CINNECT VECTOR CONTEXT ---\n${lines.join('\n\n')}`;
}
