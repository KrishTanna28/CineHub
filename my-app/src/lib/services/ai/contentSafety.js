/**
 * Cinnect AI Assistant - Content Safety Module
 * All content moderation is handled by AI models.
 * No hardcoded pattern detection - everything goes through ML models.
 */

import { moderateText } from '@/lib/services/moderation.service';

// Thresholds - higher = more lenient
const TOXICITY_THRESHOLD = 0.7;

/**
 * Check text for toxic/offensive content using toxic-bert
 * @param {string} text - Text to analyze
 * @returns {Promise<{isToxic: boolean, score: number, labels: object}>}
 */
export async function detectToxicity(text) {
  if (!text || text.trim().length < 3) {
    return { isToxic: false, score: 0, labels: {} };
  }

  try {
    const result = await moderateText(text);
    return {
      isToxic: result.isAdult || result.score > TOXICITY_THRESHOLD,
      score: result.score,
      labels: result.labels
    };
  } catch (error) {
    console.error('[ContentSafety] Toxicity detection error:', error);
    // Mark for offline processing instead of using patterns
    return { isToxic: false, score: 0, labels: {}, needsProcessing: true };
  }
}

/**
 * Check text for spam - handled by AI models in offline processing
 * @param {string} text - Text to analyze
 * @returns {{isSpam: boolean, needsProcessing: boolean}}
 */
export function detectSpam(text) {
  if (!text) return { isSpam: false, needsProcessing: false };

  // Spam detection is handled by AI models in the offline cron job
  // Return false here and mark for processing
  return {
    isSpam: false,
    needsProcessing: true
  };
}

/**
 * Run full content safety check on user message
 * @param {string} message - User message to check
 * @returns {Promise<ContentSafetyResult>}
 */
export async function checkContentSafety(message) {
  const [toxicity, spam] = await Promise.all([
    detectToxicity(message),
    Promise.resolve(detectSpam(message))
  ]);

  const isSafe = !toxicity.isToxic && !spam.isSpam;

  return {
    isSafe,
    toxicity,
    spam,
    shouldWarn: toxicity.score > 0.3 && toxicity.score < TOXICITY_THRESHOLD,
    shouldBlock: toxicity.isToxic,
    needsProcessing: toxicity.needsProcessing || spam.needsProcessing,
    reason: !isSafe ? (
      toxicity.isToxic ? 'toxic_content' : null
    ) : null
  };
}

/**
 * Get appropriate response for unsafe content
 */
export function getUnsafeContentResponse(safetyResult) {
  if (safetyResult.toxicity?.isToxic) {
    return "I'm here to help with movies and entertainment! Let's keep our conversation friendly and respectful. What would you like to know about movies or TV shows?";
  }

  return "Let's talk about movies and TV shows! What are you interested in?";
}
