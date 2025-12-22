import { GoogleGenerativeAI } from '@google/generative-ai';
import Review from '../models/Review.js';
import User from '../models/User.js';

/**
 * AI-Powered Moderation Bot
 * Analyzes reviews for quality, spam, and appropriateness
 * Automatically adjusts points and removes spam
 */

class ModerationBot {
  constructor() {
    // Initialize Google Gemini
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Spam detection patterns
    this.spamPatterns = [
      /(.)\1{10,}/i, // Repeated characters
      /https?:\/\//gi, // URLs
      /\b(buy|click|visit|download|free|win|prize)\b/gi, // Spam keywords
      /\b(\d{3}[-.]?\d{3}[-.]?\d{4})\b/g, // Phone numbers
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi // Email addresses
    ];

    // Offensive content patterns
    this.offensivePatterns = [
      // Add patterns for offensive content (customize based on your needs)
      /\b(hate|racist|sexist)\b/gi
    ];
  }

  /**
   * Main moderation function - analyzes review and takes action
   */
  async moderateReview(review, user) {
    try {
      const analysis = await this.analyzeReview(review);
      
      const actions = {
        pointsAdjustment: 0,
        shouldRemove: false,
        shouldFlag: false,
        warnings: [],
        bonuses: [],
        reason: ''
      };

      // 1. Check for spam
      if (analysis.isSpam || this.detectSpamPatterns(review.content)) {
        actions.shouldRemove = true;
        actions.pointsAdjustment = -50; // Heavy penalty
        actions.reason = 'Spam detected';
        actions.warnings.push('Review flagged as spam and removed');
      }

      // 2. Check for offensive content
      if (analysis.isOffensive || this.detectOffensiveContent(review.content)) {
        actions.shouldRemove = true;
        actions.pointsAdjustment = -30;
        actions.reason = 'Offensive content detected';
        actions.warnings.push('Review contains inappropriate content');
      }

      // 3. Check for duplicate/plagiarized content
      if (await this.isDuplicateContent(review, user)) {
        actions.shouldFlag = true;
        actions.pointsAdjustment = -20;
        actions.warnings.push('Possible duplicate content detected');
      }

      // 4. Quality assessment bonuses
      if (!actions.shouldRemove) {
        const qualityBonus = this.calculateQualityBonus(analysis);
        actions.pointsAdjustment += qualityBonus;
        if (qualityBonus > 0) {
          actions.bonuses.push(`Quality bonus: +${qualityBonus} points`);
        }
      }

      // 5. Check for constructive criticism
      if (analysis.isConstructive && !actions.shouldRemove) {
        actions.pointsAdjustment += 15;
        actions.bonuses.push('Constructive review bonus: +15 points');
      }

      // 6. Check for spoilers without tag (ONLY penalize if not tagged)
      if (analysis.containsSpoilers && !review.spoiler) {
        actions.shouldFlag = true;
        actions.pointsAdjustment -= 15;
        actions.warnings.push('Spoilers detected but not tagged: -15 points');
      }
      // If spoilers are properly tagged, no penalty (and no bonus)

      // 7. Check for insightful analysis
      if (analysis.isInsightful && !actions.shouldRemove) {
        actions.pointsAdjustment += 20;
        actions.bonuses.push('Insightful analysis bonus: +20 points');
      }

      // 8. Check for low effort
      if (analysis.isLowEffort && !actions.shouldRemove) {
        actions.pointsAdjustment -= 15;
        actions.warnings.push('Low effort content: -15 points');
      }

      // Execute actions
      await this.executeActions(review, user, actions, analysis);

      return {
        success: true,
        actions,
        analysis
      };

    } catch (error) {
      console.error('Moderation bot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze review using AI (Google Gemini)
   */
  async analyzeReview(review) {
    try {
      const prompt = `You are a content moderation AI. Analyze this movie/TV show review objectively and respond ONLY with valid JSON.

Review Title: "${review.title}"
Review Content: "${review.content}"
Rating: ${review.rating}/10

Analyze for:
1. Is it spam? (promotional content, irrelevant, gibberish)
2. Is it offensive? (hate speech, harassment, inappropriate)
3. Contains spoilers? (plot reveals, ending details)
4. Is it constructive? (provides reasoning, balanced perspective)
5. Is it insightful? (deep analysis, unique perspective, well-articulated)
6. Is it low effort? (very short, no substance, just emoji/symbols)
7. Quality score (0-100)
8. Sentiment (positive/negative/neutral)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "isSpam": boolean,
  "isOffensive": boolean,
  "containsSpoilers": boolean,
  "isConstructive": boolean,
  "isInsightful": boolean,
  "isLowEffort": boolean,
  "qualityScore": number,
  "sentiment": "positive" | "negative" | "neutral",
  "reasoning": "brief explanation"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const analysis = JSON.parse(text);

      return analysis;

    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to pattern-based detection
      return {
        isSpam: this.detectSpamPatterns(review.content),
        isOffensive: this.detectOffensiveContent(review.content),
        containsSpoilers: false,
        isConstructive: review.content.length > 100,
        isInsightful: review.content.length > 300,
        isLowEffort: review.content.length < 50,
        qualityScore: Math.min(100, review.content.length / 5),
        sentiment: 'neutral',
        reasoning: 'Fallback analysis (AI unavailable)'
      };
    }
  }

  /**
   * Detect spam using pattern matching
   */
  detectSpamPatterns(content) {
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for excessive repetition
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      return true; // Less than 30% unique words = likely spam
    }

    return false;
  }

  /**
   * Detect offensive content
   */
  detectOffensiveContent(content) {
    for (const pattern of this.offensivePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for duplicate content
   */
  async isDuplicateContent(review, user) {
    try {
      // Get user's other reviews
      const userReviews = await Review.find({
        user: user._id,
        _id: { $ne: review._id }
      }).limit(10);

      // Simple similarity check
      const reviewWords = new Set(review.content.toLowerCase().split(/\s+/));
      
      for (const otherReview of userReviews) {
        const otherWords = new Set(otherReview.content.toLowerCase().split(/\s+/));
        const intersection = new Set([...reviewWords].filter(x => otherWords.has(x)));
        const similarity = intersection.size / Math.min(reviewWords.size, otherWords.size);
        
        if (similarity > 0.8) {
          return true; // 80% similar = duplicate
        }
      }

      return false;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return false;
    }
  }

  /**
   * Calculate quality bonus based on AI analysis
   */
  calculateQualityBonus(analysis) {
    let bonus = 0;

    // Quality score bonus (0-30 points)
    if (analysis.qualityScore >= 90) {
      bonus += 30;
    } else if (analysis.qualityScore >= 75) {
      bonus += 20;
    } else if (analysis.qualityScore >= 60) {
      bonus += 10;
    }

    return bonus;
  }

  /**
   * Execute moderation actions
   */
  async executeActions(review, user, actions, analysis) {
    try {
      // 1. Remove review if flagged
      if (actions.shouldRemove) {
        review.isRemoved = true;
        review.removalReason = actions.reason;
        review.moderatedAt = new Date();
        review.moderatedBy = 'AI_BOT';
        await review.save();

        // Log moderation action
        await this.logModerationAction({
          reviewId: review._id,
          userId: user._id,
          action: 'REMOVE',
          reason: actions.reason,
          analysis
        });
      }

      // 2. Flag for manual review
      if (actions.shouldFlag && !actions.shouldRemove) {
        review.isFlagged = true;
        review.flagReason = actions.warnings.join(', ');
        await review.save();
      }

      // 3. Adjust user points
      if (actions.pointsAdjustment !== 0) {
        user.points.total += actions.pointsAdjustment;
        user.points.available += actions.pointsAdjustment;

        // Ensure points don't go negative
        if (user.points.total < 0) user.points.total = 0;
        if (user.points.available < 0) user.points.available = 0;

        await user.save();

        // Log point adjustment
        await this.logPointAdjustment({
          userId: user._id,
          reviewId: review._id,
          adjustment: actions.pointsAdjustment,
          reason: [...actions.warnings, ...actions.bonuses].join(', '),
          analysis
        });
      }

      // 4. Update user's duplicate content flag
      if (actions.warnings.some(w => w.includes('duplicate'))) {
        user.hasDuplicateContent = true;
        await user.save();
      }

    } catch (error) {
      console.error('Execute actions error:', error);
      throw error;
    }
  }

  /**
   * Log moderation action for audit trail
   */
  async logModerationAction(data) {
    try {
      // You can create a ModerationLog model for this
      console.log('Moderation Action:', {
        timestamp: new Date(),
        ...data
      });
      
      // TODO: Save to database
      // await ModerationLog.create(data);
    } catch (error) {
      console.error('Log moderation error:', error);
    }
  }

  /**
   * Log point adjustment
   */
  async logPointAdjustment(data) {
    try {
      console.log('Point Adjustment:', {
        timestamp: new Date(),
        ...data
      });
      
      // TODO: Save to database
      // await PointsLog.create(data);
    } catch (error) {
      console.error('Log points error:', error);
    }
  }

  /**
   * Moderate reply
   */
  async moderateReply(reply, review, user) {
    try {
      const actions = {
        pointsAdjustment: 0,
        shouldRemove: false,
        warnings: [],
        bonuses: []
      };

      // Check for spam
      if (this.detectSpamPatterns(reply.content)) {
        actions.shouldRemove = true;
        actions.pointsAdjustment = -20;
        actions.warnings.push('Spam reply removed');
      }

      // Check for offensive content
      if (this.detectOffensiveContent(reply.content)) {
        actions.shouldRemove = true;
        actions.pointsAdjustment = -15;
        actions.warnings.push('Offensive reply removed');
      }

      // Quality bonus for thoughtful replies
      if (reply.content.length > 100 && !actions.shouldRemove) {
        actions.pointsAdjustment += 5;
        actions.bonuses.push('Thoughtful reply bonus: +5 points');
      }

      // Execute actions
      if (actions.shouldRemove) {
        // Remove reply from review
        review.replies = review.replies.filter(r => r._id.toString() !== reply._id.toString());
        await review.save();
      }

      if (actions.pointsAdjustment !== 0) {
        user.points.total += actions.pointsAdjustment;
        user.points.available += actions.pointsAdjustment;
        if (user.points.total < 0) user.points.total = 0;
        if (user.points.available < 0) user.points.available = 0;
        await user.save();
      }

      return {
        success: true,
        actions
      };

    } catch (error) {
      console.error('Reply moderation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch moderate reviews (for scheduled jobs)
   */
  async batchModerate(limit = 50) {
    try {
      // Get recent unmoderated reviews
      const reviews = await Review.find({
        moderatedAt: { $exists: false },
        isRemoved: { $ne: true }
      })
      .populate('user')
      .limit(limit)
      .sort({ createdAt: -1 });

      const results = {
        processed: 0,
        removed: 0,
        flagged: 0,
        pointsAdjusted: 0
      };

      for (const review of reviews) {
        const result = await this.moderateReview(review, review.user);
        results.processed++;
        
        if (result.actions?.shouldRemove) results.removed++;
        if (result.actions?.shouldFlag) results.flagged++;
        if (result.actions?.pointsAdjustment !== 0) results.pointsAdjusted++;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;

    } catch (error) {
      console.error('Batch moderation error:', error);
      throw error;
    }
  }
}

// Singleton instance
const moderationBot = new ModerationBot();

export default moderationBot;
