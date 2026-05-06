"use client"

import { useCallback, useMemo, useState } from "react"

import { useMutation } from "@tanstack/react-query"
import type { VerifyParam } from "rc-slider-captcha"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { useI18n } from "@/providers/i18n-provider"
import { signinApi } from "@/stores/auth-api"
import type {
  AccountSigninParam,
  QuerySigninTenantsParam,
  SigninTenantOption,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"
import {
  buildSigninCaptchaPayload,
  createSigninFormSchema,
  DEFAULT_SIGNIN_VALUES,
  getSigninFormErrors,
  resolveSigninRoute,
  type SigninFormErrors,
  type SigninFormValues,
} from "../helpers"

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
  const formSchema = useMemo(() => createSigninFormSchema(t), [t])

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

  const isLoading = queryTenantsMutation.isPending || accountSigninMutation.isPending

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
      router.replace(resolveSigninRoute(tenant))
    },
    [accountSigninMutation, captchaFormData, router, t]
  )

  return {
    view: {
      values,
      errors,
      isLoading,
      showSlider,
      onSubmit: handleSubmit,
      onFieldChange: handleFieldChange,
      onVerifySuccess: handleVerifySuccess,
      onVerifyError: handleVerifyError,
    },
    dialog: {
      open: showTenantDialog,
      tenants,
      loading: accountSigninMutation.isPending,
      onOpenChange: handleTenantDialogOpenChange,
      onSubmit: handleTenantSubmit,
    },
  }
}
