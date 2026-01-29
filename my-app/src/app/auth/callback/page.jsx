"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/UserContext"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useUser()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      // Handle OAuth error
      console.error('OAuth error:', error)
      router.push(`/login?error=${error}`)
      return
    }

    if (token && userStr) {
      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userStr))

        // Save using context
        login(token, user)

        // Redirect to home
        router.push('/')
        router.refresh()
      } catch (err) {
        console.error('Error parsing OAuth response:', err)
        router.push('/login?error=invalid_response')
      }
    } else {
      router.push('/login?error=missing_credentials')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
  )
}
