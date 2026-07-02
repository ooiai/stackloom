"use client"

import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"
import { useAuthVerification } from "@/hooks/use-auth-verification"
import { ROUTER_ENUM } from "@/lib/config/enums"
import Loading from "@/app/loading"

interface BaseLayoutClientProps {
  children: ReactNode
}

export function BaseLayoutClient({ children }: BaseLayoutClientProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuthVerification()

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTER_ENUM.SIGNIN)
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading while auth is being verified
  if (isLoading) {
    return <Loading />
  }

  // Don't render if not authenticated (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
