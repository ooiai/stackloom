"use client"

import { useMemo, useState } from "react"

import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { VerifyParam } from "rc-slider-captcha"

import PasswordStrengthInput from "@/components/topui/password-strength-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { setStorageItem } from "@/hooks/use-persisted-state"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { AuthTokenResult } from "@/lib/http/axios"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { signinApi } from "@/stores/auth-api"
import type {
  AccountAuthParam,
  ListSelectOrgunit,
  QueryOrgUnitsParam,
} from "@/types/auth.types"
import type { SliderCaptcha } from "@/types/system.types"

import CryptUtil from "@/lib/crypt"
import CaptchaSlider from "./captcha-slider"
import { SelectTenantDialog } from "./select-tenant-dialog"

type FormValues = {
  account: string
  password: string
}
type FormErrors = Partial<Record<keyof FormValues, string>>

const DEFAULT_VALUES: FormValues = {
  account: "",
  password: "",
}

const DASHBOARD_ROUTE = "/upms/users"

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { t } = useI18n()
  const router = useRouter()
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSlider, setShowSlider] = useState(false)
  const [showTenantDialog, setShowTenantDialog] = useState(false)
  const [captchaFormData, setCaptchaFormData] = useState<SliderCaptcha | null>(
    null
  )
  const [tenants, setTenants] = useState<ListSelectOrgunit[]>([])
  const formSchema = useMemo(
    () =>
      z.object({
        account: z.string().min(1, t("auth.signin.validation.accountRequired")),
        password: z.string().min(8, t("auth.signin.validation.passwordMin")),
      }),
    [t]
  )

  const queryOrgUnitsMutation = useMutation({
    mutationFn: (params: QueryOrgUnitsParam) => signinApi.queryOrgUnits(params),
    onError: () => {
      setShowSlider(false)
    },
  })

  const accountAuthMutation = useMutation({
    mutationFn: (params: AccountAuthParam) => signinApi.accountAuth(params),
    onSuccess: (data: AuthTokenResult) => {
      setStorageItem(
        STORAGE_ENUM.TOKEN,
        JSON.stringify(data),
        data.refreshExpiresAt
      )
      toast.success(t("auth.signin.toast.success"))
      router.replace(DASHBOARD_ROUTE)
    },
    onError: () => {
      setShowSlider(false)
      setShowTenantDialog(false)
    },
  })

  const isLoading =
    queryOrgUnitsMutation.isPending || accountAuthMutation.isPending

  const updateValue = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }

      return { ...current, [key]: undefined }
    })
  }

  const validate = () => {
    const result = formSchema.safeParse(values)

    if (result.success) {
      setErrors({})
      return true
    }

    const nextErrors: FormErrors = {}
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof FormValues | undefined
      if (path && !nextErrors[path]) {
        nextErrors[path] = issue.message
      }
    }

    setErrors(nextErrors)
    return false
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setShowTenantDialog(false)
    setShowSlider(true)
  }

  const handleVerifySuccess = async (verifyData: VerifyParam) => {
    const hashedPassword = await CryptUtil.bcryptHash(values.password || "", 10)

    const payload: SliderCaptcha = {
      account: values.account,
      password: hashedPassword,
      code: JSON.stringify(verifyData),
    }

    const nextTenants = await queryOrgUnitsMutation.mutateAsync({
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
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">{t("auth.signin.title")}</h1>
            <p className="text-sm text-balance text-muted-foreground">
              {t("auth.signin.subtitle")}
            </p>
          </div>

          <Field data-invalid={!!errors.account}>
            <FieldLabel htmlFor="form-signin-account">
              {t("auth.signin.accountLabel")}
            </FieldLabel>
            <Input
              id="form-signin-account"
              type="text"
              placeholder={t("auth.signin.accountPlaceholder")}
              autoComplete="username"
              disabled={isLoading}
              value={values.account}
              onChange={(event) => updateValue("account", event.target.value)}
            />
            {errors.account ? <FieldError>{errors.account}</FieldError> : null}
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center">
              <FieldLabel htmlFor="form-signin-password">
                {t("auth.signin.passwordLabel")}
              </FieldLabel>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                {t("auth.signin.forgotPassword")}
              </a>
            </div>
            <PasswordStrengthInput
              id="form-signin-password"
              placeholder={t("auth.signin.passwordPlaceholder")}
              autoComplete="current-password"
              disabled={isLoading}
              value={values.password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateValue("password", event.target.value)
              }
            />
            {errors.password ? (
              <FieldError>{errors.password}</FieldError>
            ) : null}
          </Field>

          {showSlider ? (
            <CaptchaSlider
              account={values.account}
              onVerifySuccess={handleVerifySuccess}
              onVerifyError={() => {
                setShowSlider(false)
              }}
            />
          ) : null}

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="size-4" /> : null}
              {t("auth.signin.submit")}
            </Button>
          </Field>

          <div className="text-center text-xs text-balance text-muted-foreground">
            {t("auth.signin.agreementPrefix")}{" "}
            <a
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
              href="#"
            >
              {t("auth.signin.userAgreement")}
            </a>{" "}
            {t("auth.signin.and")}{" "}
            <a
              className="text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
              href="#"
            >
              {t("auth.signin.privacyPolicy")}
            </a>
          </div>

          <FieldSeparator>{t("auth.signin.continueWith")}</FieldSeparator>

          <Field>
            <Button variant="outline" type="button" className="w-full">
              {t("auth.signin.goWebsite")}
            </Button>
            <FieldDescription className="text-center">
              {t("auth.signin.contactAdmin")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>

      <SelectTenantDialog
        open={showTenantDialog}
        tenants={tenants}
        loading={accountAuthMutation.isPending}
        onOpenChange={setShowTenantDialog}
        onSubmit={async (tenant) => {
          if (!captchaFormData) {
            toast.error(t("auth.signin.toast.captchaExpired"))
            setShowTenantDialog(false)
            return
          }

          await accountAuthMutation.mutateAsync({
            account: captchaFormData.account,
            password: captchaFormData.password ?? "",
            code: captchaFormData.code,
            tid: tenant.tid,
            uid: tenant.uid,
            ouid: tenant.ouid,
            rids: tenant.rids,
            pids: tenant.pids,
          })
        }}
      />
    </>
  )
}
