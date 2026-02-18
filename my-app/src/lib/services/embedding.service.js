import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-004";

/**
 * Generate an embedding vector for a given text using Gemini embedding API.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The embedding vector.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Text is required for embedding generation");
  }

  // Truncate to ~8000 chars to stay within model limits
  const truncated = text.slice(0, 8000);

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: truncated,
  });

  return response.embeddings[0].values;
}

/**
 * Generate embeddings for multiple texts in batch.
 * @param {string[]} texts - Array of texts to embed.
 * @returns {Promise<number[][]>} Array of embedding vectors.
 */
export async function generateEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      results.push(embedding);
    } catch (error) {
      console.error("Error generating embedding for text:", error);
      results.push(null);
    }
  }
  return results;
}
