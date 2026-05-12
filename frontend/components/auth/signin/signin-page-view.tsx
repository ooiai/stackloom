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
  onForgotPassword: () => void
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError: () => void
  onOAuthLogin: (provider: string) => Promise<void>
}

export function SigninPageView({
  values,
  errors,
  isLoading,
  showSlider,
  onSubmit,
  onFieldChange,
  onForgotPassword,
  onVerifySuccess,
  onVerifyError,
  onOAuthLogin,
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
            onForgotPassword={onForgotPassword}
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

          <Field className="gap-2">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={() => onOAuthLogin("google")}
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("auth.signin.oauth.googleLabel")}
            </Button>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={() => onOAuthLogin("github")}
            >
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {t("auth.signin.oauth.githubLabel")}
            </Button>
          </Field>

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
