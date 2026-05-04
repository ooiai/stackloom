"use client"

import Link from "next/link"
import type { VerifyParam } from "rc-slider-captcha"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import CaptchaSlider from "@/components/auth/captcha-slider"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { SigninFormErrors, SigninFormValues } from "./helpers"
import { SigninFormFields } from "./signin-form-fields"

interface SigninPageViewProps {
  values: SigninFormValues
  errors: SigninFormErrors
  isLoading: boolean
  showSlider: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onFieldChange: (key: keyof SigninFormValues, value: string) => void
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError: () => void
}

export function SigninPageView({
  values,
  errors,
  isLoading,
  showSlider,
  onSubmit,
  onFieldChange,
  onVerifySuccess,
  onVerifyError,
}: SigninPageViewProps) {
  const { t } = useI18n()

  return (
    <AuthPageShell
      logoAlt={t("auth.signin.logoAlt")}
      heroAlt={t("auth.signin.heroAlt")}
      heroTitle={t("auth.signin.heroTitle")}
      heroDescription={t("auth.signin.heroDescription")}
    >
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">{t("auth.signin.title")}</h1>
            <p className="text-sm text-balance text-muted-foreground">
              {t("auth.signin.subtitle")}
            </p>
          </div>

          <SigninFormFields
            values={values}
            errors={errors}
            isLoading={isLoading}
            onValueChange={onFieldChange}
          />

          {showSlider ? (
            <CaptchaSlider
              account={values.account}
              onVerifySuccess={onVerifySuccess}
              onVerifyError={onVerifyError}
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
            <Link
              className="text-primary underline underline-offset-4"
              href="/terms"
            >
              {t("auth.signin.userAgreement")}
            </Link>{" "}
            {t("auth.signin.and")}{" "}
            <Link
              className="text-primary underline underline-offset-4"
              href="/privacy"
            >
              {t("auth.signin.privacyPolicy")}
            </Link>
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
    </AuthPageShell>
  )
}
