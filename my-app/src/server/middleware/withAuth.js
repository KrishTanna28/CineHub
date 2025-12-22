import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Higher-order function to protect API routes with authentication
 * Usage: export const GET = withAuth(async (request, { user }) => { ... })
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: 'No token provided' },
          { status: 401 }
        )
      }

      const token = authHeader.replace('Bearer ', '')

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        // Fetch user from database
        const user = await User.findById(decoded.userId).select('-password')
        
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 401 }
          )
        }

        // Add user to context
        const enhancedContext = { ...context, user }
        
        return handler(request, enhancedContext)
      } catch (jwtError) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Usage: export const GET = withOptionalAuth(async (request, { user }) => { ... })
 */
export function withOptionalAuth(handler) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token, continue without user
        return handler(request, { ...context, user: null })
      }

      const token = authHeader.replace('Bearer ', '')

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')
        
        const enhancedContext = { ...context, user: user || null }
        return handler(request, enhancedContext)
      } catch (jwtError) {
        // Invalid token, continue without user
        return handler(request, { ...context, user: null })
      }
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      return handler(request, { ...context, user: null })
    }
  }
}
