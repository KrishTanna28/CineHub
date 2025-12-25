/**
 * AI-Powered Points Calculation System using Gemini
 * Combines deterministic logic with LLM-based quality assessment
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Points Calculator - Functional Module
  
  /**
   * Main entry point: Calculate points with AI enhancement
   */
export async function calculateReviewPoints(review, user, context = {}) {
    const breakdown = {};
    
    // 1. Base Points (deterministic logic)
    const basePoints = calculateBasePoints(review);
    breakdown.base = basePoints;
    
    // 2. AI Quality Score (0-1 multiplier)
    const qualityScore = await analyzeReviewQuality(review);
    breakdown.aiQuality = qualityScore;
    
    // 3. Authenticity Check (sentiment vs rating alignment)
    const authenticityScore = await checkAuthenticity(review);
    breakdown.authenticity = authenticityScore;
    
    // 4. Engagement Quality (meaningful interactions only)
    const engagementScore = await analyzeEngagementQuality(review, context);
    breakdown.engagement = engagementScore;
    
    // 5. Content Analysis (spoilers, duplicates, genre detection)
    const contentAnalysis = await analyzeContent(review, user);
    breakdown.content = contentAnalysis;
    
    // 6. Behavior Modeling (credibility score)
    const credibilityScore = calculateCredibility(user);
    breakdown.credibility = credibilityScore;
    
    // 7. Calculate Final Points using Hybrid Formula
    const finalPoints = calculateFinalScore(
      basePoints,
      qualityScore,
      authenticityScore,
      engagementScore,
      contentAnalysis,
      credibilityScore,
      user
    );
    
    // 8. Generate Explanatory Feedback
    const feedback = await generateFeedback(breakdown, review);
    
    return {
      total: Math.max(0, finalPoints),
      breakdown,
      feedback,
      multiplier: calculateMultiplier(user)
    };
  }
  
  /**
   * 1. Calculate base points (deterministic)
   */
export function calculateBasePoints(review) {
    let points = 0;
    const details = {};
    
    // Length-based points
    const length = review.content.length;
    if (length < 100) {
      points += 10;
      details.length = { points: 10, tier: 'short' };
    } else if (length < 300) {
      points += 25;
      details.length = { points: 25, tier: 'medium' };
    } else if (length < 500) {
      points += 40;
      details.length = { points: 40, tier: 'detailed' };
    } else {
      points += 60;
      details.length = { points: 60, tier: 'in-depth' };
    }
    
    // Title quality
    if (review.title && review.title.length > 10) {
      points += 5;
      details.title = 5;
    }
    
    return { total: points, details };
  }
  
  /**
   * 2. AI Quality Analysis using Gemini
   */
export async function analyzeReviewQuality(review) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze this movie/TV review for quality. Return ONLY a JSON object with these exact fields:

Review Text: "${review.content}"
Rating Given: ${review.rating}/10

Analyze:
1. coherence: Grammar, structure, readability (0-1)
2. emotionalBalance: Balanced tone, not overly emotional (0-1)
3. reasoning: Evidence, examples, logical arguments (0-1)
4. originality: Unique insights, not repetitive (0-1)
5. overallQuality: Combined quality score (0-1)

Return format:
{
  "coherence": 0.85,
  "emotionalBalance": 0.90,
  "reasoning": 0.75,
  "originality": 0.80,
  "overallQuality": 0.82
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        return {
          score: scores.overallQuality || 0.5,
          details: scores,
          points: Math.round(scores.overallQuality * 100) // 0-100 points
        };
      }
      
      // Fallback if AI fails
      return { score: 0.7, details: {}, points: 70 };
      
    } catch (error) {
      console.error('AI Quality Analysis failed:', error);
      return { score: 0.7, details: {}, points: 70 }; // Neutral fallback
    }
  }
  
  /**
   * 3. Authenticity Check (sentiment vs rating alignment)
   */
export async function checkAuthenticity(review) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze sentiment-rating alignment. Return ONLY a JSON object:

Review: "${review.content}"
User Rating: ${review.rating}/10

Determine:
1. sentimentScore: Detected sentiment (0-10 scale)
2. alignment: How well sentiment matches rating (0-1)
3. authentic: Is this review authentic? (true/false)
4. reason: Brief explanation

Return format:
{
  "sentimentScore": 8.5,
  "alignment": 0.95,
  "authentic": true,
  "reason": "Sentiment matches rating well"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Calculate authenticity points
        let points = 0;
        if (analysis.authentic && analysis.alignment > 0.8) {
          points = 50; // High authenticity bonus
        } else if (analysis.alignment > 0.6) {
          points = 25; // Moderate authenticity
        } else {
          points = -20; // Penalty for mismatch
        }
        
        return {
          score: analysis.alignment,
          authentic: analysis.authentic,
          points,
          details: analysis
        };
      }
      
      return { score: 0.8, authentic: true, points: 40 };
      
    } catch (error) {
      console.error('Authenticity check failed:', error);
      return { score: 0.8, authentic: true, points: 40 };
    }
  }
  
  /**
   * 4. Engagement Quality Analysis
   */
export async function analyzeEngagementQuality(review, context) {
    const likes = review.likeCount || 0;
    const dislikes = review.dislikeCount || 0;
    const replies = context.replies || [];
    
    // Normalize engagement using global averages
    const globalAvgLikes = context.globalAvgLikes || 10;
    const rawEngagement = (likes - dislikes) / Math.max(globalAvgLikes, 1);
    
    // Apply sigmoid curve to limit extreme gains
    const normalizedEngagement = sigmoid(rawEngagement);
    
    // Analyze reply quality with AI
    let meaningfulReplies = 0;
    
    if (replies.length > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const replyTexts = replies.slice(0, 10).map(r => r.content).join('\n---\n');
        const prompt = `Classify these replies as: insightful, agreement, spam, or toxic.
Return ONLY a JSON array:

Replies:
${replyTexts}

Return format:
[
  {"type": "insightful"},
  {"type": "agreement"},
  {"type": "spam"}
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const classifications = JSON.parse(jsonMatch[0]);
          meaningfulReplies = classifications.filter(c => 
            c.type === 'insightful' || c.type === 'agreement'
          ).length;
        }
      } catch (error) {
        console.error('Reply analysis failed:', error);
        meaningfulReplies = Math.floor(replies.length * 0.7); // Assume 70% meaningful
      }
    }
    
    const engagementPoints = Math.round(normalizedEngagement * 100) + (meaningfulReplies * 5);
    
    return {
      score: normalizedEngagement,
      meaningfulReplies,
      points: engagementPoints,
      details: { likes, dislikes, totalReplies: replies.length, meaningfulReplies }
    };
  }
  
  /**
   * 5. Content Analysis (spoilers, duplicates, genre detection)
   */
export async function analyzeContent(review, user) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze this review for content issues. Return ONLY a JSON object:

Review: "${review.content}"
Has Spoiler Tag: ${review.hasSpoilers || false}

Detect:
1. hasSpoilers: Contains plot spoilers? (true/false)
2. spoilerSentences: List of spoiler sentences (array)
3. isDuplicate: Seems copied or generic? (true/false)
4. detectedGenres: Inferred genres from text (array)
5. contentQuality: Overall content quality (0-1)

Return format:
{
  "hasSpoilers": false,
  "spoilerSentences": [],
  "isDuplicate": false,
  "detectedGenres": ["Action", "Sci-Fi"],
  "contentQuality": 0.85
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        let points = 0;
        let penalties = 0;
        
        // Spoiler penalty
        if (analysis.hasSpoilers && !review.hasSpoilers) {
          penalties -= 20;
        }
        
        // Duplicate penalty
        if (analysis.isDuplicate) {
          penalties -= 30;
        }
        
        // Genre diversity bonus
        const newGenres = analysis.detectedGenres.filter(g => 
          !user.reviewedGenres?.includes(g)
        );
        points += newGenres.length * 10;
        
        return {
          points: points + penalties,
          penalties,
          details: analysis,
          newGenres
        };
      }
      
      return { points: 0, penalties: 0, details: {}, newGenres: [] };
      
    } catch (error) {
      console.error('Content analysis failed:', error);
      return { points: 0, penalties: 0, details: {}, newGenres: [] };
    }
  }
  
  /**
   * 6. Behavior Modeling & Credibility Score
   */
export function calculateCredibility(user) {
    let credibility = 1.0;
    const factors = {};
    
    // Check for rating extremes
    const extremeRatings = user.ratingDistribution?.extreme || 0;
    const totalRatings = user.totalReviews || 1;
    const extremeRatio = extremeRatings / totalRatings;
    
    if (extremeRatio > 0.7) {
      credibility *= 0.7; // 30% penalty
      factors.extremeRatings = -0.3;
    } else if (extremeRatio > 0.5) {
      credibility *= 0.85;
      factors.extremeRatings = -0.15;
    }
    
    // Check for review bursts (spam detection)
    const recentReviews = user.recentReviewCount || 0;
    if (recentReviews > 20) { // More than 20 reviews in short time
      credibility *= 0.6;
      factors.reviewBurst = -0.4;
    }
    
    // Reward consistent quality
    const avgQuality = user.avgReviewQuality || 0.7;
    if (avgQuality > 0.85) {
      credibility *= 1.2;
      factors.highQuality = 0.2;
    }
    
    // Account age factor
    const accountAge = user.accountAgeDays || 0;
    if (accountAge < 7) {
      credibility *= 0.8;
      factors.newAccount = -0.2;
    } else if (accountAge > 365) {
      credibility *= 1.1;
      factors.establishedAccount = 0.1;
    }
    
    return {
      score: Math.max(0.3, Math.min(1.5, credibility)), // Clamp between 0.3-1.5
      factors
    };
  }
  
  /**
   * 7. Calculate Final Score (Hybrid Formula)
   */
export function calculateFinalScore(base, quality, authenticity, engagement, content, credibility, user) {
    // Hybrid Logic Framework:
    // Total = (Base × Quality) + (Engagement × LLM-weight) + (Authenticity × Trust) - Penalties
    
    const basePoints = base.total * quality.score; // Base modulated by AI quality
    const engagementPoints = engagement.points * credibility.score; // Engagement weighted by trust
    const authenticityPoints = authenticity.points * credibility.score; // Authenticity weighted by trust
    const contentPoints = content.points;
    const penalties = content.penalties;
    
    const subtotal = basePoints + engagementPoints + authenticityPoints + contentPoints + penalties;
    
    // Apply streak multiplier
    const multiplier = calculateMultiplier(user);
    const finalPoints = subtotal * multiplier;
    
    // Add streak bonus
    const streakBonus = calculateStreakPoints(user.reviewStreak || 0);
    
    return Math.round(finalPoints + streakBonus);
  }
  
  /**
   * 8. Generate Explanatory Feedback
   */
export async function generateFeedback(breakdown, review) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Generate brief, encouraging feedback for this review analysis:

Quality Score: ${breakdown.aiQuality?.score || 0.7}
Authenticity: ${breakdown.authenticity?.authentic ? 'High' : 'Low'}
Engagement: ${breakdown.engagement?.points || 0} points
Content Issues: ${breakdown.content?.penalties || 0} penalties

Create a 1-2 sentence summary highlighting strengths and areas for improvement.
Be encouraging and specific.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text.trim();
      
    } catch (error) {
      console.error('Feedback generation failed:', error);
      return 'Your review has been analyzed. Keep writing detailed, authentic reviews to earn more points!';
    }
  }
  
  /**
   * Helper: Sigmoid function for normalization
   */
export function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  
  /**
   * Calculate streak multiplier
   */
export function calculateMultiplier(user) {
    const streak = user.reviewStreak || 0;
    
    if (streak >= 30) return 1.5;
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.1;
    
    return 1.0;
  }
  
  /**
   * Calculate streak bonus points
   */
export function calculateStreakPoints(streak) {
    if (streak >= 30) return 200;
    if (streak >= 7) return 50;
    if (streak >= 3) return 20;
    return 0;
  }
  
  /**
   * Periodic re-evaluation of points (for engagement updates)
   */
export async function reevaluateReview(review, user, context) {
    // Apply time decay
    const reviewAge = Date.now() - new Date(review.createdAt).getTime();
    const daysSinceCreation = reviewAge / (1000 * 60 * 60 * 24);
    
    // Recalculate with current engagement
    const updatedPoints = await calculateReviewPoints(review, user, context);
    
    // Apply decay factor (older reviews get less weight on updates)
    const decayFactor = Math.exp(-daysSinceCreation / 90); // 90-day half-life
    
    return {
      ...updatedPoints,
      total: Math.round(updatedPoints.total * decayFactor),
      decayApplied: decayFactor
    };
  }
export default AIPointsCalculator;

