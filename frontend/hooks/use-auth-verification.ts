"use client"

import { useEffect, useState } from "react"
import { profileApi } from "@/stores/base-api"
import { getStoreToken } from "@/lib/http/axios"
import type { UserProfileData } from "@/types/base.types"

export interface AuthVerificationState {
  isLoading: boolean
  isAuthenticated: boolean
  user: UserProfileData | null
  error: Error | null
}

/**
 * Hook to verify authentication status.
 * Checks if token exists and is valid by calling the profile API.
 * Returns loading state, authentication status, user data, and any errors.
 */
export function useAuthVerification(): AuthVerificationState {
  const [state, setState] = useState<AuthVerificationState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  })

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = getStoreToken()

        if (!token) {
          setState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null,
          })
          return
        }

        // Verify token by calling profile API
        const user = await profileApi.get()

        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          error: null,
        })
      } catch (error) {
        // Token is invalid or API call failed
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: error instanceof Error ? error : new Error("Unknown error"),
        })
      }
    }

    verifyAuth()
  }, [])

  return state
}
