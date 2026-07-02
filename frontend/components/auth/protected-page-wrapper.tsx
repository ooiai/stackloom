"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthVerification } from "@/hooks/use-auth-verification"
import { ROUTER_ENUM } from "@/lib/config/enums"

interface ProtectedPageWrapperProps {
  children: ReactNode
  /**
   * Fallback loading component to display while verifying auth.
   * If not provided, a default spinner is shown.
   */
  loadingComponent?: ReactNode
  /**
   * Custom behavior when user is not authenticated.
   * If not provided, redirects to /signin
   */
  onUnauthorized?: () => void
}

/**
 * Component wrapper for pages that require authentication.
 * Displays loading state while verifying auth, then either shows content or redirects.
 *
 * Usage:
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <ProtectedPageWrapper>
 *       <YourPageContent />
 *     </ProtectedPageWrapper>
 *   )
 * }
 * ```
 */
export function ProtectedPageWrapper({
  children,
  loadingComponent,
  onUnauthorized,
}: ProtectedPageWrapperProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuthVerification()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (onUnauthorized) {
        onUnauthorized()
      } else {
        router.replace(ROUTER_ENUM.SIGNIN)
      }
    }
  }, [isLoading, isAuthenticated, router, onUnauthorized])

  // While loading, show loading component or nothing (let loading.tsx handle it)
  if (isLoading) {
    return loadingComponent || null
  }

  // If not authenticated, don't render content (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
