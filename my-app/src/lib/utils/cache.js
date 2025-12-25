import { createClient } from 'redis'

// Module-level state
let client = null
let isConnected = false
const defaultTTL = 3600 // 1 hour in seconds

/**
 * Connect to Redis
 * @returns {Promise<void>}
 */
export async function connect() {
  // Skip Redis if not explicitly enabled
  if (!process.env.REDIS_URL || process.env.REDIS_ENABLED === 'false') {
    console.log('ℹ️  Redis disabled - running without cache')
    isConnected = false
    return
  }

  try {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            console.log('⚠️  Redis: Max retries reached, disabling cache')
            isConnected = false
            return false
          }
          return Math.min(retries * 300, 1000)
        },
      },
    })

    client.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Error:', err.message)
      }
      isConnected = false
    })

    client.on('connect', () => {
      console.log('🔄 Redis: Connecting...')
    })

    client.on('ready', () => {
      console.log('✅ Redis: Connected and ready')
      isConnected = true
    })

    client.on('end', () => {
      console.log('⚠️  Redis: Connection closed')
      isConnected = false
    })

    // Add timeout to prevent hanging
    const connectPromise = client.connect()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 3000)
    )

    await Promise.race([connectPromise, timeoutPromise])
  } catch (error) {
    if (error.message === 'Connection timeout') {
      console.log('⚠️  Redis: Connection timeout - running without cache')
    } else {
      console.log('ℹ️  Redis unavailable - running without cache')
    }
    isConnected = false
    if (client) {
      try {
        await client.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
      client = null
    }
  }
}

/**
 * Disconnect from Redis
 * @returns {Promise<void>}
 */
export async function disconnect() {
  if (client && isConnected) {
    await client.quit()
    isConnected = false
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null
 */
export async function get(key) {
  if (!isConnected) return null

  try {
    const value = await client.get(key)
    if (value) {
      return JSON.parse(value)
    }
    return null
  } catch (error) {
    console.error('Redis get error:', error.message)
    return null
  }
}

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function set(key, value, ttl = defaultTTL) {
  if (!isConnected) return false

  try {
    await client.setEx(key, ttl, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Redis set error:', error.message)
    return false
  }
}

/**
 * Delete key from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
export async function del(key) {
  if (!isConnected) return false

  try {
    await client.del(key)
    return true
  } catch (error) {
    console.error('Redis del error:', error.message)
    return false
  }
}

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Key pattern
 * @returns {Promise<boolean>} Success status
 */
export async function delPattern(pattern) {
  if (!isConnected) return false

  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
    return true
  } catch (error) {
    console.error('Redis delPattern error:', error.message)
    return false
  }
}

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Exists status
 */
export async function exists(key) {
  if (!isConnected) return false

  try {
    const result = await client.exists(key)
    return result === 1
  } catch (error) {
    console.error('Redis exists error:', error.message)
    return false
  }
}

/**
 * Get TTL of a key
 * @param {string} key - Cache key
 * @returns {Promise<number>} TTL in seconds
 */
export async function ttl(key) {
  if (!isConnected) return -1

  try {
    return await client.ttl(key)
  } catch (error) {
    console.error('Redis ttl error:', error.message)
    return -1
  }
}

/**
 * Flush all cache
 * @returns {Promise<boolean>} Success status
 */
export async function flushAll() {
  if (!isConnected) return false

  try {
    await client.flushAll()
    return true
  } catch (error) {
    console.error('Redis flushAll error:', error.message)
    return false
  }
}

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(ttl = defaultTTL) {
  return async (req, res, next) => {
    if (!isConnected) {
      return next()
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`

    try {
      const cachedData = await get(cacheKey)
      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`)
        return res.json(cachedData)
      }

      console.log(`Cache MISS: ${cacheKey}`)

      const originalJson = res.json.bind(res)

      res.json = (data) => {
        set(cacheKey, data, ttl).catch((err) => {
          console.error('Failed to cache response:', err.message)
        })
        return originalJson(data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error.message)
      next()
    }
  }
}

// Getter for isConnected status
export function getIsConnected() {
  return isConnected
}

// Use global singleton pattern to prevent reconnection on hot reload
const globalForCache = globalThis
if (!globalForCache._cacheInitialized) {
  connect()
  globalForCache._cacheInitialized = true
}

// Named exports are provided above (connect, disconnect, get, set, del, delPattern,
// exists, ttl, flushAll, cacheMiddleware, getIsConnected)
