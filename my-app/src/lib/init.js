import connectDB from './config/database.js'
import { connect as connectCache, getIsConnected } from './utils/cache.js'

// Use global singleton to prevent reinitialization on hot reload
const globalForInit = globalThis;

/**
 * Initialize server-side services (database, cache, etc.)
 * This should be called once when the app starts
 */
export async function initializeServer() {
  if (globalForInit._serverInitialized) {
    return
  }

  try {
    console.log('🚀 Initializing server services...')

    // Connect to MongoDB
    await connectDB()
    console.log('✅ Database connected')

    // Connect to Redis cache (optional, non-blocking)
    try {
      await connectCache()
      if (getIsConnected()) {
        console.log('✅ Redis cache enabled')
      } else {
        console.log('⚠️  Running without Redis cache')
      }
    } catch (cacheError) {
      console.log('⚠️  Redis cache not available, continuing without cache')
    }

    globalForInit._serverInitialized = true
    console.log('✅ Server initialization complete')
  } catch (error) {
    console.error('❌ Server initialization failed:', error)
    throw error
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeServer().catch(console.error)
}
