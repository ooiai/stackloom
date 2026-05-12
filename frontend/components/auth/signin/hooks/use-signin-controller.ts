"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useMutation } from "@tanstack/react-query"
import type { VerifyParam } from "rc-slider-captcha"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { useI18n } from "@/providers/i18n-provider"
import { signinApi, oauthProviderApi } from "@/stores/auth-api"
import type {
  AccountSigninParam,
  QuerySigninTenantsParam,
  ResetPasswordParam,
  SigninTenantOption,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import {
  createForgotPasswordSchema,
  buildSigninCaptchaPayload,
  createSigninFormSchema,
  DEFAULT_SIGNIN_VALUES,
  DEFAULT_FORGOT_PASSWORD_VALUES,
  getForgotPasswordFormErrors,
  getSigninFormErrors,
  resolveSigninRoute,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
  type SigninFormErrors,
  type SigninFormValues,
} from "../helpers"
import CryptUtil from "@/lib/crypt"

export function useSigninController() {
  const { t } = useI18n()
  const router = useRouter()
  const [values, setValues] = useState<SigninFormValues>(DEFAULT_SIGNIN_VALUES)
  const [errors, setErrors] = useState<SigninFormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  // Keep the captcha-verified payload so the final signin can reuse it after tenant selection.
  const [captchaFormData, setCaptchaFormData] = useState<SliderCaptcha | null>(
    null
  )
  const [tenants, setTenants] = useState<SigninTenantOption[]>([])
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormValues>(
    DEFAULT_FORGOT_PASSWORD_VALUES
  )
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordFormErrors>({})
  const [showRecoverySlider, setShowRecoverySlider] = useState(false)
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)
  const formSchema = useMemo(() => createSigninFormSchema(t), [t])
  const forgotSchema = useMemo(() => createForgotPasswordSchema(t), [t])

  const queryTenantsMutation = useMutation({
    // Signin is intentionally two-step: verify captcha first, then load available memberships.
    mutationFn: (params: QuerySigninTenantsParam) => signinApi.queryTenants(params),
    onError: () => {
      setShowSlider(false)
    },
  })

  const accountSigninMutation = useMutation({
    mutationFn: (params: AccountSigninParam) => signinApi.accountSignin(params),
    onError: () => {
      setShowSlider(false)
      setShowTenantDialog(false)
    },
  })

  const sendResetCodeMutation = useMutation({
    mutationFn: (params: {
      channel: "phone" | "email"
      account: string
      code: string
    }) => signinApi.sendPasswordResetCode(params),
    onSuccess: () => {
      setShowRecoverySlider(false)
      setResendCooldownSeconds(60)
      toast.success(t("auth.recovery.toast.codeSent"))
    },
    onError: () => {
      setShowRecoverySlider(false)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (params: ResetPasswordParam) => signinApi.resetPassword(params),
    onSuccess: () => {
      toast.success(t("auth.recovery.toast.resetSuccess"))
      setForgotOpen(false)
      setForgotValues(DEFAULT_FORGOT_PASSWORD_VALUES)
      setForgotErrors({})
      setShowRecoverySlider(false)
    },
  })

  const isLoading = queryTenantsMutation.isPending || accountSigninMutation.isPending

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setResendCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendCooldownSeconds])

  const handleFieldChange = useCallback(
    (key: keyof SigninFormValues, value: string) => {
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

    setErrors(getSigninFormErrors(result.error))
    return false
  }, [formSchema, values])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!validate()) {
        return
      }

      setShowTenantDialog(false)
      setShowSlider(true)
    },
    [validate]
  )

  const handleVerifySuccess = useCallback(
    async (verifyData: VerifyParam) => {
      const payload = buildSigninCaptchaPayload(values, verifyData)

      const nextTenants = await queryTenantsMutation.mutateAsync({
        account: payload.account,
        password: payload.password ?? "",
        code: payload.code,
      })

      if (!nextTenants.length) {
        setShowSlider(false)
        toast.error(t("auth.signin.toast.noOrg"))
        return
      }

      setCaptchaFormData(payload)
      setTenants(nextTenants)
      setShowSlider(false)
      setShowTenantDialog(true)
    },
    [queryTenantsMutation, t, values]
  )

  const handleVerifyError = useCallback(() => {
    setShowSlider(false)
  }, [])

  const handleTenantDialogOpenChange = useCallback((open: boolean) => {
    setShowTenantDialog(open)
  }, [])

  const handleForgotValueChange = useCallback(
    (key: keyof ForgotPasswordFormValues, value: string) => {
      setForgotValues((current) => ({ ...current, [key]: value }))
      setForgotErrors((current) => {
        if (!current[key]) {
          return current
        }
        return { ...current, [key]: undefined }
      })
    },
    []
  )

  const handleOpenForgotPassword = useCallback(() => {
    setForgotOpen(true)
  }, [])

  const handleForgotOpenChange = useCallback((open: boolean) => {
    setForgotOpen(open)
    if (!open) {
      setShowRecoverySlider(false)
    }
  }, [])

  const handleSendRecoveryCode = useCallback(() => {
    const account = forgotValues.account.trim()
    if (!account) {
      setForgotErrors((current) => ({
        ...current,
        account: t("auth.recovery.validation.accountRequired"),
      }))
      return
    }
    setShowRecoverySlider(true)
  }, [forgotValues.account, t])

  const handleRecoveryVerifySuccess = useCallback(
    async (verifyData: VerifyParam) => {
      await sendResetCodeMutation.mutateAsync({
        channel: forgotValues.channel,
        account: forgotValues.account.trim(),
        code: JSON.stringify(verifyData),
      })
    },
    [forgotValues.account, forgotValues.channel, sendResetCodeMutation]
  )

  const handleRecoveryVerifyError = useCallback(() => {
    setShowRecoverySlider(false)
  }, [])

  const handleForgotSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const parsed = forgotSchema.safeParse(forgotValues)
      if (!parsed.success) {
        setForgotErrors(getForgotPasswordFormErrors(parsed.error))
        return
      }

      setForgotErrors({})
      await resetPasswordMutation.mutateAsync({
        channel: forgotValues.channel,
        account: forgotValues.account.trim(),
        captcha: forgotValues.captcha.trim(),
        new_password: CryptUtil.md5Double(forgotValues.new_password),
      })
    },
    [forgotSchema, forgotValues, resetPasswordMutation]
  )

  const handleTenantSubmit = useCallback(
    async (tenant: SigninTenantOption) => {
      if (!captchaFormData) {
        toast.error(t("auth.signin.toast.captchaExpired"))
        setShowTenantDialog(false)
        return
      }

      // The backend issues tokens against the exact `membership_id + tenant_id` pair.
      const data = await accountSigninMutation.mutateAsync({
        account: captchaFormData.account,
        password: captchaFormData.password ?? "",
        code: captchaFormData.code,
        membership_id: tenant.membership_id,
        tenant_id: tenant.tenant_id,
      })

      setStorageItem(
        STORAGE_ENUM.TOKEN,
        JSON.stringify(data),
        data.refresh_expires_at
      )
      toast.success(t("auth.signin.toast.success"))

      // If the user arrived via a returnTo link (e.g. from the join invite page),
      // redirect there; otherwise fall back to the default dashboard route.
      const searchParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      )
      const returnTo = searchParams.get("returnTo")
      const safeReturnTo =
        returnTo && returnTo.startsWith("/") ? returnTo : null
      router.replace(safeReturnTo ?? resolveSigninRoute(tenant))
    },
    [accountSigninMutation, captchaFormData, router, t]
  )

  const handleOAuthLogin = useCallback(
    async (provider: string) => {
      try {
        const data = await oauthProviderApi.providerLogin(provider)
        window.location.href = data.redirect_url
      } catch {
        toast.error(t("signin.oauth.loginError"))
      }
    },
    [t]
  )

  return {
    view: {
      values,
      errors,
      isLoading,
      showSlider,
      onSubmit: handleSubmit,
      onFieldChange: handleFieldChange,
      onForgotPassword: handleOpenForgotPassword,
      onVerifySuccess: handleVerifySuccess,
      onVerifyError: handleVerifyError,
      onOAuthLogin: handleOAuthLogin,
    },
    dialog: {
      open: showTenantDialog,
      tenants,
      loading: accountSigninMutation.isPending,
      onOpenChange: handleTenantDialogOpenChange,
      onSubmit: handleTenantSubmit,
    },
    recovery: {
      open: forgotOpen,
      values: forgotValues,
      errors: forgotErrors,
      isSendingCode: sendResetCodeMutation.isPending,
      isResetting: resetPasswordMutation.isPending,
      resendCooldownSeconds,
      showSlider: showRecoverySlider,
      onOpenChange: handleForgotOpenChange,
      onValueChange: handleForgotValueChange,
      onSendCode: handleSendRecoveryCode,
      onSubmit: handleForgotSubmit,
      onVerifySuccess: handleRecoveryVerifySuccess,
      onVerifyError: handleRecoveryVerifyError,
    },
  }
}
