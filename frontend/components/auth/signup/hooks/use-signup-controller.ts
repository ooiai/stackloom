"use client"

import { useCallback, useMemo, useState } from "react"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import type { VerifyParam } from "rc-slider-captcha"
import { toast } from "sonner"

import {
  buildRouteWithReturnTo,
  buildSigninWithReturnTo,
  sanitizeReturnTo,
} from "@/lib/auth-navigation"
import { useI18n } from "@/providers/i18n-provider"
import { signupApi } from "@/stores/auth-api"
import { memberApi } from "@/stores/web-api"
import type { AccountSignupResult } from "@/types/auth.types"
import {
  buildAccountSignupParam,
  buildInviteSignupParam,
  createSignupFormSchema,
  DEFAULT_SIGNUP_VALUES,
  getSignupFormErrors,
  type SignupFormErrors,
  type SignupFormValues,
} from "../helpers"

export function useSignupController() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [values, setValues] = useState<SignupFormValues>(DEFAULT_SIGNUP_VALUES)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [signupResult, setSignupResult] = useState<AccountSignupResult | null>(
    null
  )
  const inviteCode = searchParams.get("inviteCode")?.trim() ?? ""
  const isInviteMode = inviteCode.length > 0
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"))
  const inviteReturnTo = isInviteMode ? `/join?code=${encodeURIComponent(inviteCode)}` : null
  const signinHref = isInviteMode
    ? buildSigninWithReturnTo(inviteReturnTo ?? "/join")
    : buildRouteWithReturnTo("/signin", returnTo)
  const successSigninHref = isInviteMode
    ? "/signin"
    : buildRouteWithReturnTo("/signin", returnTo)
  const formSchema = useMemo(() => createSignupFormSchema(t), [t])

  const inviteQuery = useQuery({
    queryKey: ["signup", "invite", inviteCode],
    queryFn: () => memberApi.validateInvite({ invite_code: inviteCode }),
    enabled: isInviteMode,
    retry: false,
  })

  const accountSignupMutation = useMutation({
    mutationFn: signupApi.accountSignup,
    onError: () => {
      setShowSlider(false)
    },
  })

  const inviteSignupMutation = useMutation({
    mutationFn: signupApi.inviteSignup,
    onError: () => {
      setShowSlider(false)
    },
  })

  const handleFieldChange = useCallback(
    (key: keyof SignupFormValues, value: string) => {
      setValues((current) => ({ ...current, [key]: value }))
      setErrors((current) => {
        if (!current[key]) {
          return current
        }

        return { ...current, [key]: undefined }
      })
    },
    []
  )

  const validate = useCallback(() => {
    const result = formSchema.safeParse(values)

    if (result.success) {
      setErrors({})
      return true
    }

    setErrors(getSignupFormErrors(result.error))
    return false
  }, [formSchema, values])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isInviteMode && !inviteQuery.data) {
        toast.error(t("auth.signup.invite.invalidDescription"))
        return
      }

      if (!validate()) {
        return
      }

      setShowSlider(true)
    },
    [inviteQuery.data, isInviteMode, t, validate]
  )

  const handleVerifySuccess = useCallback(
    async (verifyData: VerifyParam) => {
      const result = isInviteMode
        ? await inviteSignupMutation.mutateAsync(
            buildInviteSignupParam(values, verifyData, inviteCode)
          )
        : await accountSignupMutation.mutateAsync(
            buildAccountSignupParam(values, verifyData)
          )

      setShowSlider(false)
      // Switching to `signupResult` renders the post-signup success state instead of the form.
      setSignupResult(result)
      toast.success(
        t(
          isInviteMode
            ? "auth.signup.invite.toast.success"
            : "auth.signup.toast.success"
        )
      )
    },
    [accountSignupMutation, inviteCode, inviteSignupMutation, isInviteMode, t, values]
  )

  const handleVerifyError = useCallback(() => {
    setShowSlider(false)
  }, [])

  return {
    view: {
      values,
      errors,
      showSlider,
      isLoading: accountSignupMutation.isPending || inviteSignupMutation.isPending,
      signupResult,
      isInviteMode,
      isInviteValidating: inviteQuery.isLoading,
      isInviteInvalid: isInviteMode && inviteQuery.isError,
      inviteTenantName: inviteQuery.data?.tenant_name ?? null,
      signinHref,
      successSigninHref,
      onSubmit: handleSubmit,
      onFieldChange: handleFieldChange,
      onVerifySuccess: handleVerifySuccess,
      onVerifyError: handleVerifyError,
    },
  }
}
