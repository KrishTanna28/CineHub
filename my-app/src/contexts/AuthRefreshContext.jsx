"use client"

import { createContext, useContext, useEffect, useRef } from 'react'
import { useUser } from './UserContext'
import { useRouter } from 'next/navigation'

const AuthRefreshContext = createContext()

export function AuthRefreshProvider({ children }) {
  const { user, logout } = useUser()
  const router = useRouter()
  const refreshIntervalRef = useRef(null)

  useEffect(() => {
    // Only set up refresh if user is logged in
    if (!user) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      return
    }

    // Check token validity every 5 minutes
    const checkAndRefreshToken = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          logout()
          return
        }

        // Decode token to check expiration (without verification)
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(window.atob(base64))
        
        const expirationTime = payload.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()
        const timeUntilExpiry = expirationTime - currentTime
        
        // If token expires in less than 1 day, refresh it
        if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
          console.log('Token expiring soon, refreshing...')
          
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()

          if (data.success) {
            localStorage.setItem('token', data.data.token)
            console.log('Token refreshed successfully')
          } else {
            // Token refresh failed, logout user
            console.error('Token refresh failed:', data.message)
            logout()
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Token check error:', error)
        // If token is invalid, logout
        logout()
        router.push('/login')
      }
    }

    // Check immediately
    checkAndRefreshToken()

    // Then check every 5 minutes
    refreshIntervalRef.current = setInterval(checkAndRefreshToken, 24 * 60 * 60 * 1000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [user, logout, router])

  return (
    <AuthRefreshContext.Provider value={{}}>
      {children}
    </AuthRefreshContext.Provider>
  )
}

export const useAuthRefresh = () => useContext(AuthRefreshContext)
