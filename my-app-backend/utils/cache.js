import { createClient } from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  async connect() {
    // Skip Redis if not explicitly enabled
    if (!process.env.REDIS_URL || process.env.REDIS_ENABLED === 'false') {
      console.log('ℹ️  Redis disabled - running without cache');
      this.isConnected = false;
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 2000, // Reduced from 5000ms to 2000ms for faster failure
          reconnectStrategy: (retries) => {
            if (retries > 2) { // Reduced from 3 to 2 retries
              console.log('⚠️  Redis: Max retries reached, disabling cache');
              this.isConnected = false;
              return false; // Stop retrying
            }
            return Math.min(retries * 300, 1000); // Faster retry with max 1s delay
          },
        },
      });

      this.client.on('error', (err) => {
        // Suppress connection refused errors to reduce noise
        if (err.code === 'ECONNREFUSED') {
          // Silent fail for connection refused
        } else {
          console.error('Redis Error:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Connected and ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️  Redis: Connection closed');
        this.isConnected = false;
      });

      // Add timeout to prevent hanging
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === 'Connection timeout') {
        console.log('⚠️  Redis: Connection timeout - running without cache');
      } else {
        console.log('ℹ️  Redis unavailable - running without cache');
      }
      this.isConnected = false;
      // Clean up client if connection failed
      if (this.client) {
        try {
          await this.client.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        this.client = null;
      }
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Get value from cache
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  // Set value in cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  // Delete key from cache
  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error.message);
      return false;
    }
  }

  // Delete multiple keys matching a pattern
  async delPattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error.message);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error.message);
      return false;
    }
  }

  // Get TTL of a key
  async ttl(key) {
    if (!this.isConnected) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error.message);
      return -1;
    }
  }

  // Flush all cache
  async flushAll() {
    if (!this.isConnected) return false;

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flushAll error:', error.message);
      return false;
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(ttl = this.defaultTTL) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      // Create cache key from request URL and query params
      const cacheKey = `cache:${req.originalUrl || req.url}`;

      try {
        const cachedData = await this.get(cacheKey);
        if (cachedData) {
          console.log(`Cache HIT: ${cacheKey}`);
          return res.json(cachedData);
        }

        console.log(`Cache MISS: ${cacheKey}`);

        // Store original res.json function
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = (data) => {
          // Cache the response
          this.set(cacheKey, data, ttl).catch((err) => {
            console.error('Failed to cache response:', err.message);
          });

          // Send the response
          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error.message);
        next();
      }
    };
  }
}

export default new CacheService();
