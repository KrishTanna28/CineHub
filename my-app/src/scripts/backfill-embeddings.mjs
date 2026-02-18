/**
 * Backfill embeddings for existing reviews and posts that don't have one yet.
 *
 * Usage:
 *   node --experimental-modules src/scripts/backfill-embeddings.mjs
 *
 * Or via Next.js:
 *   Add to package.json scripts and run with `npm run backfill-embeddings`
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URL = process.env.MONGODB_URL;

if (!GEMINI_API_KEY || !MONGODB_URL) {
  console.error("Missing GEMINI_API_KEY or MONGODB_URL in environment");
  process.exit(1);
}

// ── Inline embedding generation (can't use path aliases in scripts) ──
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function generateEmbedding(text) {
  const truncated = text.slice(0, 8000);
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: truncated,
  });
  return response.embeddings[0].values;
}

// ── Connect to MongoDB ──
await mongoose.connect(MONGODB_URL, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
});
console.log("✅ Connected to MongoDB");

const db = mongoose.connection.db;

// ── Backfill reviews ──
async function backfillReviews() {
  const collection = db.collection("reviews");
  const cursor = collection.find({ embedding: { $exists: false } });

  let count = 0;
  for await (const doc of cursor) {
    const text = `${doc.mediaTitle || ""} — ${doc.title || ""}. ${doc.content || ""}`;
    try {
      const embedding = await generateEmbedding(text);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { embedding } }
      );
      count++;
      if (count % 10 === 0) console.log(`  Reviews processed: ${count}`);
    } catch (err) {
      console.error(`  Failed to embed review ${doc._id}:`, err.message);
    }
    // Rate-limit: ~5 requests/sec to stay within free-tier limits
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`✅ Backfilled ${count} reviews`);
}

// ── Backfill posts ──
async function backfillPosts() {
  const collection = db.collection("posts");
  const cursor = collection.find({ embedding: { $exists: false } });

  let count = 0;
  for await (const doc of cursor) {
    const text = `${doc.title || ""}. ${doc.content || ""}`;
    try {
      const embedding = await generateEmbedding(text);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { embedding } }
      );
      count++;
      if (count % 10 === 0) console.log(`  Posts processed: ${count}`);
    } catch (err) {
      console.error(`  Failed to embed post ${doc._id}:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`✅ Backfilled ${count} posts`);
}

// ── Run ──
console.log("🔄 Backfilling review embeddings...");
await backfillReviews();

console.log("🔄 Backfilling post embeddings...");
await backfillPosts();

await mongoose.disconnect();
console.log("✅ Done. Don't forget to create Atlas Vector Search indexes!");
console.log(`
  Required Atlas Vector Search indexes (create via Atlas UI or CLI):

  1. Index name: "review_embedding_index" on collection "reviews"
     Field: "embedding", dimensions: 768, similarity: "cosine"

  2. Index name: "post_embedding_index" on collection "posts"
     Field: "embedding", dimensions: 768, similarity: "cosine"
`);
process.exit(0);
