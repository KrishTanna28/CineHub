"use client"

import { UserProvider } from "@/contexts/UserContext"
import { AuthRefreshProvider } from "@/contexts/AuthRefreshContext"

export function Providers({ children }) {
  return (
    <UserProvider>
      <AuthRefreshProvider>
        {children}
      </AuthRefreshProvider>
    </UserProvider>
  )
}
