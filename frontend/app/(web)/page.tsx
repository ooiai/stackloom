"use client"

import { useRouter } from "next/navigation"
import { useAuthVerification } from "@/hooks/use-auth-verification"
import { ROUTER_ENUM } from "@/lib/config/enums"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuthVerification()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to dashboard for authenticated users
        router.replace(ROUTER_ENUM.DASHBOARD)
      } else {
        // Redirect to signin for unauthenticated users
        router.replace(ROUTER_ENUM.SIGNIN)
      }
    }
  }, [isLoading, isAuthenticated, router])

  // Show nothing while loading (let loading.tsx handle the display)
  return null
}
