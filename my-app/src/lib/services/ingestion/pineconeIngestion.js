import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenAI } from '@google/genai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import connectDB from '@/lib/config/database';
import Review from '@/lib/models/Review';
import Post from '@/lib/models/Post';
import Community from '@/lib/models/Community';

const INDEX_NAME = process.env.PINECONE_INDEX;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const DEFAULT_LOOKBACK_HOURS = 24;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_EMBEDDING_DIMENSIONS = 3072;
const DEFAULT_EMBEDDING_BATCH_SIZE = 50;
const APP_BASE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://cinnect.vercel.app').replace(/\/$/, '');

class StrictGoogleGenAIEmbeddings extends Embeddings {
  constructor({ apiKey, model, dimensions, maxBatchSize }) {
    super({ maxConcurrency: 2, maxRetries: 3 });
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
    this.dimensions = dimensions;
    this.maxBatchSize = maxBatchSize;
  }

  async embedDocuments(texts) {
    const vectors = [];

    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const batch = texts.slice(i, i + this.maxBatchSize).map(text => normalizeText(text));
      const response = await this.caller.call(() => this.client.models.embedContent({
        model: this.model,
        contents: batch,
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: this.dimensions
        }
      }));

      const embeddings = response.embeddings || [];
      if (embeddings.length !== batch.length) {
        throw new Error(`Embedding batch returned ${embeddings.length} vectors for ${batch.length} documents`);
      }

      for (const embedding of embeddings) {
        vectors.push(embedding.values || []);
      }
    }

    return vectors;
  }

  async embedQuery(text) {
    const response = await this.caller.call(() => this.client.models.embedContent({
      model: this.model,
      contents: normalizeText(text),
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: this.dimensions
      }
    }));

    return response.embeddings?.[0]?.values || [];
  }
}

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getEmbeddingsClient() {
  const apiKey = requireEnv(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY');
  const dimensions = toPositiveInt(process.env.EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_DIMENSIONS);
  const maxBatchSize = toPositiveInt(process.env.GEMINI_EMBEDDING_BATCH_SIZE, DEFAULT_EMBEDDING_BATCH_SIZE);

  return new StrictGoogleGenAIEmbeddings({
    apiKey,
    model: EMBEDDING_MODEL,
    dimensions,
    maxBatchSize
  });
}

function getPineconeIndex() {
  const apiKey = requireEnv(process.env.PINECONE_API_KEY, 'PINECONE_API_KEY');
  const pinecone = new Pinecone({ apiKey });
  return pinecone.Index(INDEX_NAME);
}

function normalizeText(value) {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
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

function joinList(values, limit) {
  if (!Array.isArray(values)) return '';
  const filtered = values.map(v => normalizeText(v)).filter(Boolean);
  const sliced = Number.isFinite(limit) ? filtered.slice(0, limit) : filtered;
  return sliced.join(', ');
}

function joinNames(items, mapFn, limit) {
  if (!Array.isArray(items)) return '';
  const mapped = items.map(mapFn).filter(Boolean);
  return joinList(mapped, limit);
}

function buildReviewText(review) {
  const title = normalizeText(review?.title);
  const content = normalizeText(review?.content);
  const mediaTitle = normalizeText(review?.mediaTitle);
  const mediaType = normalizeText(review?.mediaType);

  const lines = [
    mediaTitle ? `Review For: ${mediaTitle}` : null,
    mediaType ? `Media Type: ${mediaType}` : null,
    Number.isFinite(review?.rating) ? `Rating: ${review.rating}/10` : null,
    title ? `Title: ${title}` : null,
    content ? `Content: ${content}` : null,
    review?.spoiler ? 'Spoiler: yes' : 'Spoiler: no'
  ].filter(Boolean);

  return lines.join('\n');
}

function buildCommunityText(community) {
  const name = normalizeText(community?.name);
  const description = normalizeText(community?.description);
  const category = normalizeText(community?.category);
  const relatedName = normalizeText(community?.relatedEntityName);
  const relatedId = normalizeText(community?.relatedEntityId);
  const relatedType = normalizeText(community?.relatedEntityType);
  const rules = joinNames(community?.rules, r => {
    const title = normalizeText(r?.title);
    const desc = normalizeText(r?.description);
    if (title && desc) return `${title}: ${desc}`;
    return title || desc;
  }, 10);

  const lines = [
    name ? `Community: ${name}` : null,
    category ? `Category: ${category}` : null,
    description ? `Description: ${description}` : null,
    relatedType ? `Related Type: ${relatedType}` : null,
    relatedName ? `Related Name: ${relatedName}` : null,
    relatedId ? `Related ID: ${relatedId}` : null,
    rules ? `Rules: ${rules}` : null
  ].filter(Boolean);

  return lines.join('\n');
}

function buildPostText(post) {
  const title = normalizeText(post?.title);
  const content = normalizeText(post?.content);
  const category = normalizeText(post?.category === 'other' ? post?.custom_category : post?.category);
  const communityName = normalizeText(post?.community?.name);
  const communitySlug = normalizeText(post?.community?.slug);

  const lines = [
    title ? `Post: ${title}` : null,
    communityName ? `Community: ${communityName}` : null,
    communitySlug ? `Community Slug: ${communitySlug}` : null,
    category ? `Category: ${category}` : null,
    content ? `Content: ${content}` : null,
    post?.spoiler ? 'Spoiler: yes' : 'Spoiler: no'
  ].filter(Boolean);

  return lines.join('\n');
}

function buildAppUrl(path) {
  return `${APP_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function upsertNamespace({ namespace, documents, ids, embeddings, pineconeIndex }) {
  if (!documents.length) return { upserted: 0 };

  const batchSize = toPositiveInt(process.env.PINECONE_INGEST_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const expectedDimensions = toPositiveInt(process.env.EMBEDDING_DIMENSIONS, DEFAULT_EMBEDDING_DIMENSIONS);
  const store = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace
  });

  let upserted = 0;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batchDocs = documents.slice(i, i + batchSize);
    const batchIds = ids.slice(i, i + batchSize);
    const vectors = await embeddings.embedDocuments(batchDocs.map(doc => doc.pageContent));

    if (vectors.length !== batchDocs.length) {
      throw new Error(`[${namespace}] Expected ${batchDocs.length} vectors, got ${vectors.length}`);
    }

    for (let j = 0; j < vectors.length; j += 1) {
      const dimension = Array.isArray(vectors[j]) ? vectors[j].length : 0;
      if (dimension !== expectedDimensions) {
        throw new Error(
          `[${namespace}] Invalid embedding dimension for ${batchIds[j]}: expected ${expectedDimensions}, got ${dimension}`
        );
      }
    }

    await store.addVectors(vectors, batchDocs, { ids: batchIds });
    upserted += batchDocs.length;
  }

  return { upserted };
}

async function runIngestionTask(name, task) {
  try {
    return { status: 'fulfilled', value: await task() };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`[Ingestion] ${name} failed:`, error);
    return {
      status: 'rejected',
      reason: message
    };
  }
}

function getErrorMessage(error) {
  const message = error?.message || 'Unknown ingestion error';

  try {
    const parsed = JSON.parse(message);
    return parsed?.error?.message || message;
  } catch {
    return message;
  }
}

async function ingestReviews({ embeddings, pineconeIndex, since }) {
  const query = {
    isRemoved: { $ne: true },
    ...(since ? { updatedAt: { $gte: since } } : {})
  };

  const reviews = await Review.find(query)
    .select('mediaId mediaType mediaTitle rating title content spoiler updatedAt')
    .lean();

  const docs = [];
  const ids = [];

  for (const review of reviews) {
    const text = buildReviewText(review);
    if (!text) continue;

    docs.push(new Document({
      pageContent: text,
      metadata: {
        type: 'review',
        reviewId: String(review._id),
        mediaId: review.mediaId,
        mediaType: review.mediaType,
        title: review.title || null,
        updatedAt: review.updatedAt || null,
        source: 'cinnect'
      }
    }));
    ids.push(`review:${review._id}`);
  }

  const result = await upsertNamespace({
    namespace: 'reviews',
    documents: docs,
    ids,
    embeddings,
    pineconeIndex
  });

  return { processed: reviews.length, ...result };
}

async function ingestCommunities({ embeddings, pineconeIndex, since }) {
  const query = {
    isActive: true,
    ...(since ? { updatedAt: { $gte: since } } : {})
  };

  const communities = await Community.find(query)
    .select('name slug description category relatedEntityId relatedEntityName relatedEntityType rules updatedAt')
    .lean();

  const docs = [];
  const ids = [];

  for (const community of communities) {
    const text = buildCommunityText(community);
    if (!text) continue;

    docs.push(new Document({
      pageContent: text,
      metadata: {
        type: 'community',
        communityId: String(community._id),
        name: community.name || null,
        slug: community.slug || null,
        url: community.slug ? buildAppUrl(`/communities/${community.slug}`) : null,
        category: community.category || null,
        relatedEntityType: community.relatedEntityType || null,
        relatedEntityId: community.relatedEntityId || null,
        updatedAt: community.updatedAt || null,
        source: 'cinnect'
      }
    }));
    ids.push(`community:${community._id}`);
  }

  const result = await upsertNamespace({
    namespace: 'communities',
    documents: docs,
    ids,
    embeddings,
    pineconeIndex
  });

  return { processed: communities.length, ...result };
}

async function ingestPosts({ embeddings, pineconeIndex, since }) {
  const query = {
    isApproved: true,
    ...(since ? { updatedAt: { $gte: since } } : {})
  };

  const posts = await Post.find(query)
    .select('title content category custom_category spoiler community updatedAt')
    .populate('community', 'name slug')
    .lean();

  const docs = [];
  const ids = [];

  for (const post of posts) {
    const text = buildPostText(post);
    if (!text) continue;

    docs.push(new Document({
      pageContent: text,
      metadata: {
        type: 'post',
        postId: String(post._id),
        communityId: post.community?._id?.toString() || null,
        communityName: post.community?.name || null,
        communitySlug: post.community?.slug || null,
        url: post.community?.slug ? buildAppUrl(`/communities/${post.community.slug}/posts/${post._id}`) : null,
        category: post.category || null,
        updatedAt: post.updatedAt || null,
        source: 'cinnect'
      }
    }));
    ids.push(`post:${post._id}`);
  }

  const result = await upsertNamespace({
    namespace: 'posts',
    documents: docs,
    ids,
    embeddings,
    pineconeIndex
  });

  return { processed: posts.length, ...result };
}

export async function runIngestion(options = {}) {
  const mode = options.mode === 'full' ? 'full' : 'delta';
  const lookbackHours = toPositiveNumber(
    options.lookbackHours || process.env.INGEST_LOOKBACK_HOURS,
    DEFAULT_LOOKBACK_HOURS
  );
  const since = mode === 'full' ? null : new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  await connectDB();

  const embeddings = getEmbeddingsClient();
  const pineconeIndex = getPineconeIndex();

  const [reviewsResult, communitiesResult, postsResult] = await Promise.all([
    runIngestionTask('reviews', () => ingestReviews({ embeddings, pineconeIndex, since })),
    runIngestionTask('communities', () => ingestCommunities({ embeddings, pineconeIndex, since })),
    runIngestionTask('posts', () => ingestPosts({ embeddings, pineconeIndex, since }))
  ]);

  const taskResults = {
    reviews: reviewsResult,
    communities: communitiesResult,
    posts: postsResult
  };
  const failures = Object.entries(taskResults)
    .filter(([, result]) => result.status === 'rejected')
    .map(([source, result]) => ({ source, reason: result.reason }));

  if (failures.length === Object.keys(taskResults).length) {
    const uniqueReasons = [...new Set(failures.map(f => f.reason))];
    const reason = uniqueReasons.length === 1
      ? uniqueReasons[0]
      : failures.map(f => `${f.source}: ${f.reason}`).join('; ');
    throw new Error(`All ingestion sources failed: ${reason}`);
  }

  return {
    mode,
    since: since ? since.toISOString() : null,
    partial: failures.length > 0,
    failures,
    reviews: reviewsResult.status === 'fulfilled' ? reviewsResult.value : { processed: 0, upserted: 0 },
    communities: communitiesResult.status === 'fulfilled' ? communitiesResult.value : { processed: 0, upserted: 0 },
    posts: postsResult.status === 'fulfilled' ? postsResult.value : { processed: 0, upserted: 0 }
  };
}
