"use client"

import { useCallback, useMemo, useState } from "react"

import { useMutation } from "@tanstack/react-query"
import type { VerifyParam } from "rc-slider-captcha"
import { toast } from "sonner"

import { useI18n } from "@/providers/i18n-provider"
import { signupApi } from "@/stores/auth-api"
import type { AccountSignupResult } from "@/types/auth.types"
import {
  buildAccountSignupParam,
  createSignupFormSchema,
  DEFAULT_SIGNUP_VALUES,
  getSignupFormErrors,
  type SignupFormErrors,
  type SignupFormValues,
} from "../helpers"

export function useSignupController() {
  const { t } = useI18n()
  const [values, setValues] = useState<SignupFormValues>(DEFAULT_SIGNUP_VALUES)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [signupResult, setSignupResult] = useState<AccountSignupResult | null>(
    null
  )
  const formSchema = useMemo(() => createSignupFormSchema(t), [t])

  const accountSignupMutation = useMutation({
    mutationFn: signupApi.accountSignup,
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

      if (!validate()) {
        return
      }

      setShowSlider(true)
    },
    [validate]
  )

  const handleVerifySuccess = useCallback(
    async (verifyData: VerifyParam) => {
      const result = await accountSignupMutation.mutateAsync(
        buildAccountSignupParam(values, verifyData)
      )

      setShowSlider(false)
      // Switching to `signupResult` renders the post-signup success state instead of the form.
      setSignupResult(result)
      toast.success(t("auth.signup.toast.success"))
    },
    [accountSignupMutation, t, values]
  )

  const handleVerifyError = useCallback(() => {
    setShowSlider(false)
  }, [])

  return {
    view: {
      values,
      errors,
      showSlider,
      isLoading: accountSignupMutation.isPending,
      signupResult,
      onSubmit: handleSubmit,
      onFieldChange: handleFieldChange,
      onVerifySuccess: handleVerifySuccess,
      onVerifyError: handleVerifyError,
    },
  }
}
