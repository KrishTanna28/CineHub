import { createClient } from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('Redis: Too many reconnection attempts, giving up');
              return new Error('Too many retries');
            }
            return retries * 100; // Exponential backoff
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis: Connected and ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis: Connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis connection failed:', error.message);
      console.log('Running without Redis cache');
      this.isConnected = false;
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
