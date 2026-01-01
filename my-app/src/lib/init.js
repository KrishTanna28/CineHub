import connectDB from './config/database.js'

// Use global singleton to prevent reinitialization on hot reload
const globalForInit = globalThis;

/**
 * Initialize server-side services (database, etc.)
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
