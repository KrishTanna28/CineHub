"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthSkeleton } from "@/components/skeletons"

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
    }
    
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return <AuthSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
