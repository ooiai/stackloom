"use client"

import { useEffect } from "react"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useHeaderContext } from "@/hooks/use-header-context"
import { useI18n } from "@/providers/i18n-provider"
import { memberApi } from "@/stores/web-api"
import { buildSigninWithReturnTo, buildSignupWithReturnTo, getJoinRedirectUrl } from "../helpers"

export function useJoinController() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("code") ?? ""

  const { user, isLoading: isUserLoading } = useHeaderContext()
  const isAuthenticated = !isUserLoading && user !== null

  const validateQuery = useQuery({
    queryKey: ["join", "validate", inviteCode],
    queryFn: () => memberApi.validateInvite({ invite_code: inviteCode }),
    enabled: !!inviteCode,
    retry: false,
  })

  const joinMutation = useMutation({
    mutationFn: () => memberApi.joinByInvite({ invite_code: inviteCode }),
    onSuccess: () => {
      toast.success(t("join.page.successTitle"))
      setTimeout(() => {
        router.replace(getJoinRedirectUrl())
      }, 1500)
    },
    onError: (error: { errorKey?: string; message?: string }) => {
      const key = error?.errorKey
      toast.error(key ? t(key) : (error?.message ?? t("common.error")))
    },
  })

  const handleJoin = () => {
    if (!isAuthenticated) {
      const currentUrl = `/join?code=${inviteCode}`
      router.push(buildSigninWithReturnTo(currentUrl))
      return
    }
    joinMutation.mutate()
  }

  const handleSignup = () => {
    const currentUrl = `/join?code=${inviteCode}`
    router.push(buildSignupWithReturnTo(currentUrl))
  }

  // Redirect already-authenticated users who hit an already-member error to dashboard.
  useEffect(() => {
    if (joinMutation.error) {
      const err = joinMutation.error as { errorKey?: string }
      if (err?.errorKey === "errors.biz.invite.alreadyMember") {
        setTimeout(() => router.replace(getJoinRedirectUrl()), 2000)
      }
    }
  }, [joinMutation.error, router])

  return {
    inviteCode,
    isUserLoading,
    isAuthenticated,
    user,
    validateQuery,
    tenantInfo: validateQuery.data ?? null,
    isValidating: validateQuery.isLoading,
    isInvalidCode: !inviteCode || validateQuery.isError,
    joinMutation,
    isJoining: joinMutation.isPending,
    isJoinSuccess: joinMutation.isSuccess,
    alreadyMember:
      (joinMutation.error as { errorKey?: string } | null)?.errorKey ===
      "errors.biz.invite.alreadyMember",
    handleJoin,
    handleSignup,
  }
}
