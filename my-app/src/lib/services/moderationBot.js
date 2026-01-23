import { GoogleGenerativeAI } from '@google/generative-ai'
import Review from '@/lib/models/Review.js'
import User from '@/lib/models/User.js'

// ===== INITIALIZATION =====

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// ===== PATTERNS =====

const spamPatterns = [
  /(.)\1{10,}/i,
  /https?:\/\//gi,
  /\b(buy|click|visit|download|free|win|prize)\b/gi,
  /\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
]

const offensivePatterns = [
  /\b(hate|racist|sexist)\b/gi
]

// ===== CORE MODERATION =====

export async function moderateReview(review, user, consensus = null) {
  try {
    const analysis = await analyzeReview(review, consensus)

    const actions = {
      pointsAdjustment: 0,
      shouldRemove: false,
      shouldFlag: false,
      warnings: [],
      bonuses: [],
      reason: ''
    }

    // ===== SPAM / OFFENSIVE =====
    if (analysis.isSpam || detectSpamPatterns(review.content)) {
      actions.shouldRemove = true
      actions.pointsAdjustment -= 50
      actions.reason = 'Spam detected'
      actions.warnings.push('Review flagged as spam and removed')
    }

    if (analysis.isOffensive || detectOffensiveContent(review.content)) {
      actions.shouldRemove = true
      actions.pointsAdjustment -= 30
      actions.reason = 'Offensive content detected'
      actions.warnings.push('Review contains inappropriate content')
    }

    // ===== DUPLICATE =====
    if (await isDuplicateContent(review, user)) {
      actions.shouldFlag = true
      actions.pointsAdjustment -= 20
      actions.warnings.push('Possible duplicate content detected')
    }

    // ===== PROMOTIONAL / ASTROTURFING (NEW) =====
    if (
      analysis.isPromotional &&
      analysis.promotionalConfidence === 'high' &&
      consensus?.averageRating !== undefined &&
      analysis.isLowEffort
    ) {
      const deviation = Math.abs(review.rating - consensus.averageRating)
      if (deviation >= 4) {
        actions.pointsAdjustment -= 25
        actions.warnings.push(
          'Review appears promotional and strongly inconsistent with audience consensus'
        )
      }
    }

    if (analysis.isPromotional && analysis.promotionalConfidence === 'medium') {
      actions.pointsAdjustment -= 10
      actions.warnings.push('Review tone appears overly promotional')
    }

    // ===== QUALITY BONUSES =====
    if (!actions.shouldRemove) {
      const qualityBonus = calculateQualityBonus(analysis)
      actions.pointsAdjustment += qualityBonus
      if (qualityBonus > 0) {
        actions.bonuses.push(`Quality bonus: +${qualityBonus}`)
      }

      if (analysis.isConstructive) {
        actions.pointsAdjustment += 15
        actions.bonuses.push('Constructive review bonus: +15')
      }

      if (analysis.isInsightful) {
        actions.pointsAdjustment += 20
        actions.bonuses.push('Insightful analysis bonus: +20')
      }

      if (analysis.isLowEffort) {
        actions.pointsAdjustment -= 15
        actions.warnings.push('Low effort content')
      }
    }

    // ===== SPOILERS =====
    if (analysis.containsSpoilers && !review.spoiler) {
      actions.shouldFlag = true
      actions.pointsAdjustment -= 15
      actions.warnings.push('Spoilers detected but not tagged')
    }

    await executeActions(review, user, actions, analysis)
    return { success: true, actions, analysis }

  } catch (error) {
    console.error('Moderation error:', error)
    return { success: false, error: error.message }
  }
}

// ===== AI ANALYSIS =====

async function analyzeReview(review, consensus) {
  try {
    const prompt = `
You are a STRICT content analysis system for moderating user reviews.
You must be conservative, fair, and evidence-based.

You are NOT allowed to:
- Assume user intent (do NOT claim the user is lying or paid)
- Penalize opinions simply because they differ from the majority
- Infer facts that are not explicitly present in the text
- Hallucinate plot details, motives, or sentiment
- Add information not present in the review or metadata

You MUST base decisions ONLY on:
- The review text itself
- The user rating
- The provided audience consensus context

--------------------
CONTEXT (FOR REFERENCE ONLY)
--------------------
Audience average rating: ${consensus?.averageRating ?? "unknown"}/10
Total number of audience reviews: ${consensus?.totalReviews ?? "unknown"}

This context is provided ONLY to judge whether a review is a strong outlier.
A rating difference alone is NEVER sufficient for penalties.

--------------------
REVIEW TO ANALYZE
--------------------
Title: "${review.title}"
Content: "${review.content}"
User Rating: ${review.rating}/10

--------------------
ANALYSIS GUIDELINES
--------------------

1. Spam Detection:
- Mark isSpam = true ONLY if the content clearly resembles advertising,
  repetitive noise, links, promotions, or meaningless filler.
- Do NOT guess spam intent.

2. Offensive Content:
- Mark isOffensive = true ONLY if the content contains explicit hate,
  harassment, or abusive language.
- Do NOT infer tone beyond explicit wording.

3. Spoilers:
- Mark containsSpoilers = true ONLY if the review clearly reveals
  plot events, endings, or twists.
- Do NOT assume spoilers.

4. Constructiveness:
- Mark isConstructive = true if the review provides reasoning,
  critique, or explanation (positive or negative).
- Mere praise or dislike without explanation is NOT constructive.

5. Insightfulness:
- Mark isInsightful = true ONLY if the review demonstrates
  depth (themes, direction, performances, pacing, structure).
- Length alone does NOT guarantee insight.

6. Low Effort:
- Mark isLowEffort = true ONLY if the review is very short,
  generic, vague, or lacks any reasoning.
- Do NOT penalize short but specific opinions.

7. Promotional / Astroturfing Detection (VERY IMPORTANT):
- Mark isPromotional = true ONLY if ALL of the following apply:
  a) The tone is exaggerated, marketing-like, or call-to-action
  b) The review lacks balanced critique or specific detail
  c) The praise is generic and non-specific
- Disagreement with the audience is NOT a reason by itself.
- If the review acknowledges disagreement or explains a minority opinion,
  it MUST NOT be marked promotional.

- promotionalConfidence:
  - "high" ONLY if evidence is strong and unambiguous
  - "medium" if tone is mildly suspicious but uncertain
  - "low" if there is insufficient evidence

8. Quality Score:
- Provide a qualityScore between 0 and 100
- Base it on clarity, specificity, reasoning, and usefulness
- Do NOT inflate scores

9. Sentiment:
- Classify as "positive", "negative", or "neutral"
- Use the review text ONLY

10. Reasoning:
- Provide a brief, factual explanation of your decisions
- Do NOT moralize or accuse

--------------------
OUTPUT RULES (MANDATORY)
--------------------
- Respond with ONLY valid JSON
- Do NOT include markdown
- Do NOT include extra text
- Do NOT include explanations outside the JSON
- All boolean fields must be true or false (no null)

--------------------
REQUIRED JSON FORMAT
--------------------
{
  "isSpam": boolean,
  "isOffensive": boolean,
  "containsSpoilers": boolean,
  "isConstructive": boolean,
  "isInsightful": boolean,
  "isLowEffort": boolean,
  "isPromotional": boolean,
  "promotionalConfidence": "low" | "medium" | "high",
  "qualityScore": number,
  "sentiment": "positive" | "negative" | "neutral",
  "reasoning": "string"
}
`;


    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    text = text.replace(/```json|```/g, '').trim()
    return JSON.parse(text)

  } catch (error) {
    console.error('AI analysis failed, using fallback')
    return fallbackAnalysis(review)
  }
}

// ===== FALLBACK =====

function fallbackAnalysis(review) {
  return {
    isSpam: detectSpamPatterns(review.content),
    isOffensive: detectOffensiveContent(review.content),
    containsSpoilers: false,
    isConstructive: review.content.length > 100,
    isInsightful: review.content.length > 300,
    isLowEffort: review.content.length < 50,
    isPromotional: false,
    promotionalConfidence: 'low',
    qualityScore: Math.min(100, review.content.length / 5),
    sentiment: 'neutral',
    reasoning: 'Fallback analysis'
  }
}

// ===== HELPERS =====

function detectSpamPatterns(content) {
  return spamPatterns.some(p => p.test(content))
}

function detectOffensiveContent(content) {
  return offensivePatterns.some(p => p.test(content))
}

// ===== DUPLICATE CHECK =====

async function isDuplicateContent(review, user) {
  const userReviews = await Review.find({
    user: user._id,
    _id: { $ne: review._id }
  }).limit(10)

  const words = new Set(review.content.toLowerCase().split(/\s+/))

  for (const r of userReviews) {
    const other = new Set(r.content.toLowerCase().split(/\s+/))
    const overlap = [...words].filter(w => other.has(w))
    if (overlap.length / Math.min(words.size, other.size) > 0.8) {
      return true
    }
  }
  return false
}

// ===== QUALITY BONUS =====

function calculateQualityBonus(analysis) {
  if (analysis.qualityScore >= 90) return 30
  if (analysis.qualityScore >= 75) return 20
  if (analysis.qualityScore >= 60) return 10
  return 0
}

// ===== EXECUTION =====

async function executeActions(review, user, actions, analysis) {
  if (actions.shouldRemove) {
    review.isRemoved = true
    review.removalReason = actions.reason
    review.moderatedAt = new Date()
    review.moderatedBy = 'AI_BOT'
    await review.save()
  }

  if (actions.shouldFlag && !actions.shouldRemove) {
    review.isFlagged = true
    review.flagReason = actions.warnings.join(', ')
    await review.save()
  }

  if (actions.pointsAdjustment !== 0) {
    user.points.total = Math.max(0, user.points.total + actions.pointsAdjustment)
    user.points.available = Math.max(0, user.points.available + actions.pointsAdjustment)
    await user.save()
  }
}

// ===== REPLY MODERATION =====

export async function moderateReply(reply, review, user) {
  let points = 0
  let removed = false

  if (detectSpamPatterns(reply.content) || detectOffensiveContent(reply.content)) {
    removed = true
    points -= 20
  } else if (reply.content.length > 100) {
    points += 5
  }

  if (removed) {
    review.replies = review.replies.filter(r => r._id?.toString() !== reply._id?.toString())
    await review.save()
  }

  user.points.total = Math.max(0, user.points.total + points)
  user.points.available = Math.max(0, user.points.available + points)
  await user.save()

  return { success: true, removed, points }
}

// ===== BATCH MODERATION =====

export async function batchModerate(limit = 50) {
  const reviews = await Review.find({
    moderatedAt: { $exists: false },
    isRemoved: { $ne: true }
  }).populate('user').limit(limit).sort({ createdAt: -1 })

  const results = { processed: 0, removed: 0, flagged: 0 }

  for (const review of reviews) {
    const res = await moderateReview(review, review.user)
    results.processed++
    if (res.actions?.shouldRemove) results.removed++
    if (res.actions?.shouldFlag) results.flagged++
    await new Promise(r => setTimeout(r, 1000))
  }

  return results
}
