"use client"

import { useMemo, useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import PasswordStrengthInput from "@/components/topui/password-strength-input"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import CryptUtil from "@/lib/crypt"
import { ROUTER_ENUM, STORAGE_ENUM } from "@/lib/config/enums"
import { useI18n } from "@/providers/i18n-provider"
import { signinApi } from "@/stores/auth-api"
import {
  createChangePasswordSchema,
  DEFAULT_CHANGE_PASSWORD_VALUES,
  getChangePasswordFormErrors,
  type ChangePasswordFormErrors,
  type ChangePasswordFormValues,
} from "./change-password-helpers"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { t } = useI18n()
  const [values, setValues] = useState<ChangePasswordFormValues>(
    DEFAULT_CHANGE_PASSWORD_VALUES
  )
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({})
  const schema = useMemo(() => createChangePasswordSchema(t), [t])

  const changePasswordMutation = useMutation({
    mutationFn: signinApi.changePassword,
    onSuccess: () => {
      toast.success(t("account.passwordDialog.success"))
      removeStorageItem(STORAGE_ENUM.TOKEN)
      window.location.href = ROUTER_ENUM.SIGNIN
    },
  })

  const isBusy = changePasswordMutation.isPending

  const resetForm = () => {
    setValues(DEFAULT_CHANGE_PASSWORD_VALUES)
    setErrors({})
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) {
      return
    }

    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetForm()
    }
  }

  const handleValueChange = (
    key: keyof ChangePasswordFormValues,
    value: string
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      setErrors(getChangePasswordFormErrors(parsed.error))
      return
    }

    setErrors({})
    await changePasswordMutation.mutateAsync({
      current_password: CryptUtil.md5Double(values.current_password),
      new_password: CryptUtil.md5Double(values.new_password),
    })
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-background p-5 shadow-2xl outline-none">
          <div className="mb-4 space-y-1">
            <DialogPrimitive.Title className="text-base font-semibold">
              {t("account.passwordDialog.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {t("account.passwordDialog.description")}
            </DialogPrimitive.Description>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field data-invalid={!!errors.current_password}>
              <FieldLabel htmlFor="change-current-password">
                {t("account.passwordDialog.currentPasswordLabel")}
              </FieldLabel>
              <Input
                id="change-current-password"
                type="password"
                disabled={isBusy}
                value={values.current_password}
                onChange={(event) =>
                  handleValueChange("current_password", event.target.value)
                }
                placeholder={t("account.passwordDialog.currentPasswordPlaceholder")}
              />
              {errors.current_password ? (
                <FieldError>{errors.current_password}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={!!errors.new_password}>
              <FieldLabel htmlFor="change-new-password">
                {t("account.passwordDialog.newPasswordLabel")}
              </FieldLabel>
              <PasswordStrengthInput
                id="change-new-password"
                disabled={isBusy}
                value={values.new_password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  handleValueChange("new_password", event.target.value)
                }
                placeholder={t("account.passwordDialog.newPasswordPlaceholder")}
              />
              {errors.new_password ? (
                <FieldError>{errors.new_password}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={!!errors.confirm_password}>
              <FieldLabel htmlFor="change-confirm-password">
                {t("account.passwordDialog.confirmPasswordLabel")}
              </FieldLabel>
              <Input
                id="change-confirm-password"
                type="password"
                disabled={isBusy}
                value={values.confirm_password}
                onChange={(event) =>
                  handleValueChange("confirm_password", event.target.value)
                }
                placeholder={t("account.passwordDialog.confirmPasswordPlaceholder")}
              />
              {errors.confirm_password ? (
                <FieldError>{errors.confirm_password}</FieldError>
              ) : null}
            </Field>

            <div className="flex justify-end gap-2">
              <DialogPrimitive.Close
                render={<Button type="button" variant="outline" />}
                disabled={isBusy}
              >
                {t("account.passwordDialog.cancel")}
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <Spinner className="size-4" /> : null}
                {isBusy
                  ? t("account.passwordDialog.submitting")
                  : t("account.passwordDialog.submit")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
