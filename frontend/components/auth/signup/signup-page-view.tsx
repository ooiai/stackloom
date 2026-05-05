"use client"

import Link from "next/link"

import type { VerifyParam } from "rc-slider-captcha"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import CaptchaSlider from "@/components/auth/captcha-slider"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useI18n } from "@/providers/i18n-provider"
import type { AccountSignupResult } from "@/types/auth.types"
import type { SignupFormErrors, SignupFormValues } from "./helpers"
import { SignupFormFields } from "./signup-form-fields"
import { SignupSuccessState } from "./signup-success-state"

interface SignupPageViewProps {
  values: SignupFormValues
  errors: SignupFormErrors
  showSlider: boolean
  isLoading: boolean
  signupResult: AccountSignupResult | null
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onFieldChange: (key: keyof SignupFormValues, value: string) => void
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError: () => void
}

export function SignupPageView({
  values,
  errors,
  showSlider,
  isLoading,
  signupResult,
  onSubmit,
  onFieldChange,
  onVerifySuccess,
  onVerifyError,
}: SignupPageViewProps) {
  const { t } = useI18n()

  return (
    <AuthPageShell
      logoAlt={t("auth.signup.logoAlt")}
      heroAlt={t("auth.signup.heroAlt")}
      heroTitle={t("auth.signup.heroTitle")}
      heroDescription={t("auth.signup.heroDescription")}
    >
      {signupResult ? (
        <SignupSuccessState result={signupResult} />
      ) : (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">{t("auth.signup.title")}</h1>
              <p className="text-sm text-balance text-muted-foreground">
                {t("auth.signup.subtitle")}{" "}
                <Link
                  href="/signin"
                  className="text-primary underline underline-offset-4"
                >
                  {t("auth.signup.signIn")}
                </Link>
              </p>
            </div>

            <SignupFormFields
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
                {t("auth.signup.submit")}
              </Button>
            </Field>

            <div className="text-center text-xs text-balance text-muted-foreground">
              {t("auth.signup.agreementPrefix")}{" "}
              <Link
                className="text-primary underline underline-offset-4"
                href="/terms"
              >
                {t("auth.signup.terms")}
              </Link>{" "}
              {t("auth.signup.and")}{" "}
              <Link
                className="text-primary underline underline-offset-4"
                href="/privacy"
              >
                {t("auth.signup.privacy")}
              </Link>
            </div>
          </FieldGroup>
        </form>
      )}
    </AuthPageShell>
  )
}
