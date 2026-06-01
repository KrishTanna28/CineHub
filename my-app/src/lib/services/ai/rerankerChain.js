import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { Document } from '@langchain/core/documents';
import { retrieveCinnectRawDocuments, canonicalizeAppLink } from './retrieval.service.js';
import { initLangChainCache } from './langchainCache';

const DEFAULT_RERANK_TOP_K = 5;
const RERANK_FETCH_MULTIPLIER = 3;

const RERANK_PROMPT = PromptTemplate.fromTemplate(`You are reranking Cinnect search results for a movie/TV assistant.

Query:
{query}

Candidate documents:
{documents}

Return JSON only with this shape:
{{
  "rankings": [
    {{"id": "candidate id", "relevance": 0.0, "reason": "short reason"}}
  ]
}}

Rank only documents that directly help answer the query. Use relevance from 0 to 1.`);

let rerankChainPromise = null;

function getRerankChain() {
  if (rerankChainPromise) return rerankChainPromise;

  initLangChainCache();

  const llm = new ChatGoogleGenerativeAI({
    model: process.env.RERANK_MODEL || 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
    maxOutputTokens: 768,
    json: true
  });

  rerankChainPromise = Promise.resolve(new LLMChain({
    llm,
    prompt: RERANK_PROMPT,
    outputKey: 'text'
  }));

  return rerankChainPromise;
}

function toPositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function parseJsonObject(text) {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Reranker did not return JSON');
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function truncate(text, maxLength = 700) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function getLabel(match) {
  const metadata = match.metadata || {};
  return metadata.name || metadata.title || metadata.communityName || metadata.mediaTitle || match.id;
}

function formatCandidates(matches) {
  return matches.map((match, index) => {
    const score = Number.isFinite(match.score) ? match.score.toFixed(3) : 'n/a';
    return `${index + 1}. id: ${match.id}
namespace: ${match.namespace}
type: ${match.type}
label: ${getLabel(match)}
score: ${score}
url: ${match.url || 'none'}
text: ${truncate(match.text)}`;
  }).join('\n\n');
}

function fallbackRank(matches, topK) {
  return matches
    .map(match => ({
      ...match,
      rerankScore: Number.isFinite(match.score) ? match.score : 0,
      rerankReason: 'Vector similarity fallback'
    }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);
}

async function rerankMatches(query, matches, topK) {
  if (!matches.length) return [];

  try {
    const chain = await getRerankChain();
    const result = await chain.call({
      query,
      documents: formatCandidates(matches)
    });
    const parsed = parseJsonObject(result.text);
    const rankingMap = new Map(
      (parsed.rankings || []).map(item => [
        item.id,
        {
          relevance: Math.max(0, Math.min(1, Number(item.relevance) || 0)),
          reason: item.reason || ''
        }
      ])
    );

    const ranked = matches
      .map(match => {
        const ranking = rankingMap.get(match.id);
        return ranking
          ? { ...match, rerankScore: ranking.relevance, rerankReason: ranking.reason }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);

    return ranked.length ? ranked : fallbackRank(matches, topK);
  } catch (error) {
    console.error('Cinnect reranker failed:', error);
    return fallbackRank(matches, topK);
  }
}

export function buildCitationMetadata(matches) {
  return matches.map((match, index) => {
    const citationId = `C${index + 1}`;
    const metadata = match.metadata || {};
    const url = canonicalizeAppLink(match.url || metadata.url || metadata.link || '');

    return {
      id: citationId,
      sourceId: match.id,
      title: getLabel(match),
      namespace: match.namespace,
      type: match.type,
      url: url || null,
      score: match.score,
      rerankScore: match.rerankScore,
      reason: match.rerankReason,
      excerpt: truncate(match.text, 240),
      metadata: {
        slug: metadata.slug || null,
        communityName: metadata.communityName || null,
        mediaTitle: metadata.mediaTitle || null,
        author: metadata.author || metadata.username || null
      }
    };
  });
}

export function citationsToContext(citations) {
  if (!Array.isArray(citations) || citations.length === 0) return 'None.';

  return citations.map(citation => {
    const url = citation.url ? `\nLink: ${citation.url}` : '';
    const score = Number.isFinite(citation.rerankScore) ? citation.rerankScore.toFixed(2) : 'n/a';
    return `[${citation.id}] ${citation.title} (${citation.namespace}/${citation.type}, relevance ${score})
${citation.excerpt}${url}`;
  }).join('\n\n');
}

export async function runRerankerCitationChain({
  query,
  namespaces,
  enabled = true,
  topK = DEFAULT_RERANK_TOP_K,
  fetchK
}) {
  if (!enabled) {
    return { documents: [], citations: [], matches: [] };
  }

  const sanitizedTopK = toPositiveInt(topK || process.env.RAG_RERANK_TOP_K, DEFAULT_RERANK_TOP_K);
  const sanitizedFetchK = toPositiveInt(
    fetchK || process.env.RAG_FETCH_K,
    sanitizedTopK * RERANK_FETCH_MULTIPLIER
  );

  const rawMatches = await retrieveCinnectRawDocuments(query, {
    namespaces,
    topK: sanitizedTopK,
    fetchK: sanitizedFetchK,
  });
  const matches = await rerankMatches(query, rawMatches, sanitizedTopK);
  const citations = buildCitationMetadata(matches);
  const documents = matches.map((match, index) => new Document({
    pageContent: `[${citations[index].id}] ${match.text}`,
    metadata: {
      ...match.metadata,
      citationId: citations[index].id,
      sourceId: match.id,
      namespace: match.namespace,
      type: match.type,
      score: match.score,
      rerankScore: match.rerankScore,
      url: citations[index].url
    }
  }));

  return { documents, citations, matches };
}
