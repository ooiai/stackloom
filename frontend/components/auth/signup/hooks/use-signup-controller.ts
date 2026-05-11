"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

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
import type { AccountSignupResult, SignupChannel } from "@/types/auth.types"
import {
  buildAccountSignupParam,
  buildInviteSignupParam,
  buildSendSignupCodeParam,
  createSignupContactSchema,
  createSignupFormSchema,
  DEFAULT_SIGNUP_VALUES,
  getSignupFormErrors,
  type SignupFormErrors,
  type SignupFormValues,
} from "../helpers"

export function useSignupController(signupChannel: SignupChannel) {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [values, setValues] = useState<SignupFormValues>(DEFAULT_SIGNUP_VALUES)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)
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
  const formSchema = useMemo(
    () => createSignupFormSchema(t, signupChannel),
    [signupChannel, t]
  )
  const contactSchema = useMemo(
    () => createSignupContactSchema(t, signupChannel),
    [signupChannel, t]
  )
  const switchHref = useMemo(() => {
    const targetPath = signupChannel === "phone" ? "/signup/email" : "/signup"
    const params = new URLSearchParams()
    if (inviteCode) {
      params.set("inviteCode", inviteCode)
    }
    if (returnTo) {
      params.set("returnTo", returnTo)
    }
    const query = params.toString()
    return query ? `${targetPath}?${query}` : targetPath
  }, [inviteCode, returnTo, signupChannel])

  const inviteQuery = useQuery({
    queryKey: ["signup", "invite", inviteCode],
    queryFn: () => memberApi.validateInvite({ invite_code: inviteCode }),
    enabled: isInviteMode,
    retry: false,
  })

  const sendSignupCodeMutation = useMutation({
    mutationFn: signupApi.sendSignupCode,
    onError: () => {
      setShowSlider(false)
    },
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

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setResendCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendCooldownSeconds])

  const validate = useCallback(() => {
    const result = formSchema.safeParse(values)

    if (result.success) {
      setErrors({})
      return true
    }

    setErrors(getSignupFormErrors(result.error))
    return false
  }, [formSchema, values])

  const validateContact = useCallback(() => {
    const result = contactSchema.safeParse(values.contact.trim())
    if (result.success) {
      setErrors((current) => ({ ...current, contact: undefined }))
      return true
    }

    const issue = result.error.issues[0]
    setErrors((current) => ({ ...current, contact: issue?.message }))
    return false
  }, [contactSchema, values.contact])

  const handleSendCode = useCallback(() => {
    if (resendCooldownSeconds > 0) {
      return
    }

    if (!validateContact()) {
      return
    }

    setShowSlider(true)
  }, [resendCooldownSeconds, validateContact])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isInviteMode && !inviteQuery.data) {
        toast.error(t("auth.signup.invite.invalidDescription"))
        return
      }

      if (!validate()) {
        return
      }

      try {
        const result = isInviteMode
          ? await inviteSignupMutation.mutateAsync(
              buildInviteSignupParam(values, signupChannel, inviteCode)
            )
          : await accountSignupMutation.mutateAsync(
              buildAccountSignupParam(values, signupChannel)
            )

        setSignupResult(result)
        toast.success(
          t(
            isInviteMode
              ? "auth.signup.invite.toast.success"
              : "auth.signup.toast.success"
          )
        )
      } catch {
        return
      }
    },
    [
      accountSignupMutation,
      inviteCode,
      inviteQuery.data,
      inviteSignupMutation,
      isInviteMode,
      signupChannel,
      t,
      validate,
      values,
    ]
  )

  const handleVerifySuccess = useCallback(
    async (verifyData: VerifyParam) => {
      await sendSignupCodeMutation.mutateAsync(
        buildSendSignupCodeParam(values, signupChannel, verifyData)
      )
      setShowSlider(false)
      setResendCooldownSeconds(60)
      toast.success(t("auth.signup.toast.codeSent"))
    },
    [sendSignupCodeMutation, signupChannel, t, values]
  )

  const handleVerifyError = useCallback(() => {
    setShowSlider(false)
  }, [])

  return {
      view: {
        signupChannel,
        values,
        errors,
        showSlider,
        resendCooldownSeconds,
        isBusy:
          sendSignupCodeMutation.isPending ||
          accountSignupMutation.isPending ||
          inviteSignupMutation.isPending,
        isSendingCode: sendSignupCodeMutation.isPending,
        isSubmitting:
          accountSignupMutation.isPending || inviteSignupMutation.isPending,
        signupResult,
        isInviteMode,
        isInviteValidating: inviteQuery.isLoading,
        isInviteInvalid: isInviteMode && inviteQuery.isError,
        inviteTenantName: inviteQuery.data?.tenant_name ?? null,
        signinHref,
        successSigninHref,
        switchHref,
        onSubmit: handleSubmit,
        onSendCode: handleSendCode,
        onFieldChange: handleFieldChange,
        onVerifySuccess: handleVerifySuccess,
        onVerifyError: handleVerifyError,
    },
  }
}
