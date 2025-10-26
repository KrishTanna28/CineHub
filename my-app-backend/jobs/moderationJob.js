import cron from 'node-cron';
import moderationBot from '../services/moderationBot.js';

/**
 * Scheduled moderation job
 * Runs periodically to moderate reviews in batch
 */

class ModerationJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the moderation job
   * Runs every 5 minutes
   */
  start() {
    console.log('🤖 Moderation bot job started');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        console.log('Moderation job already running, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        console.log('Running moderation batch...');
        
        const results = await moderationBot.batchModerate(50);
        
        console.log('Moderation batch completed:', {
          processed: results.processed,
          removed: results.removed,
          flagged: results.flagged,
          pointsAdjusted: results.pointsAdjusted,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Moderation job error:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Also run immediately on startup
    this.runOnce();
  }

  /**
   * Run moderation once (for testing or manual trigger)
   */
  async runOnce() {
    try {
      console.log('Running one-time moderation...');
      const results = await moderationBot.batchModerate(50);
      console.log('One-time moderation completed:', results);
      return results;
    } catch (error) {
      console.error('One-time moderation error:', error);
      throw error;
    }
  }
}

const moderationJob = new ModerationJob();

export default moderationJob;
