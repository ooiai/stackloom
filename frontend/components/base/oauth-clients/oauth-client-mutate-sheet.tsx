"use client"

import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/reui/textarea"
import { Checkbox } from "@/components/reui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { LabelField } from "@/components/topui/label-field"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"
import { useOAuthClientMutateForm } from "@/components/base/oauth-clients/hooks/use-oauth-client-mutate-form"
import { KNOWN_SCOPES, getOAuthClientStatusOptions } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  OAuthClientData,
  OAuthClientFormValues,
  OAuthClientMutateMode,
  OAuthClientStatus,
} from "@/types/base.types"

interface OAuthClientMutateSheetProps {
  open: boolean
  mode: OAuthClientMutateMode
  client: OAuthClientData | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: OAuthClientFormValues) => Promise<void>
}

export function OAuthClientMutateSheet({
  open,
  mode,
  client,
  isSubmitting,
  onClose,
  onSubmit,
}: OAuthClientMutateSheetProps) {
  const { t } = useI18n()

  const title =
    mode === "create"
      ? t("oauth-clients.sheet.createTitle")
      : t("oauth-clients.sheet.editTitle")
  const description =
    mode === "create"
      ? t("oauth-clients.sheet.createDescription")
      : t("oauth-clients.sheet.editDescription")

  const { defaultValues, form } = useOAuthClientMutateForm({
    mode,
    client,
    onSubmit,
  })

  const statusOptions = getOAuthClientStatusOptions(t)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues)
      onClose()
    }
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    onClose()
  }

  const isBusy = isSubmitting || form.state.isSubmitting

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <EntityMutateSheetHeader title={title} description={description} />

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 pt-4 pb-6">
            <FieldGroup>
              {/* Name */}
              <form.Field name="name">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <LabelField
                      label={t("oauth-clients.form.nameLabel")}
                      htmlFor={field.name}
                      invalid={isInvalid}
                      error={
                        isInvalid && field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : null
                      }
                    >
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t("oauth-clients.form.namePlaceholder")}
                        aria-invalid={isInvalid}
                      />
                    </LabelField>
                  )
                }}
              </form.Field>

              {/* Client Secret (create only) */}
              {mode === "create" ? (
                <form.Field name="client_secret">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <LabelField
                        label={t("oauth-clients.form.secretLabel")}
                        htmlFor={field.name}
                        invalid={isInvalid}
                        error={
                          isInvalid && field.state.meta.errors.length > 0
                            ? String(field.state.meta.errors[0])
                            : null
                        }
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t("oauth-clients.form.secretPlaceholder")}
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                        />
                      </LabelField>
                    )
                  }}
                </form.Field>
              ) : null}

              {/* Redirect URIs */}
              <form.Field name="redirect_uris">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <LabelField
                      label={t("oauth-clients.form.redirectUrisLabel")}
                      htmlFor={field.name}
                      invalid={isInvalid}
                      description={t(
                        "oauth-clients.form.redirectUrisDescription"
                      )}
                      error={
                        isInvalid && field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : null
                      }
                    >
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t(
                          "oauth-clients.form.redirectUrisPlaceholder"
                        )}
                        rows={3}
                        aria-invalid={isInvalid}
                      />
                    </LabelField>
                  )
                }}
              </form.Field>

              {/* Allowed Scopes */}
              <form.Field name="allowed_scopes">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <LabelField
                      label={t("oauth-clients.form.scopesLabel")}
                      invalid={isInvalid}
                      description={t("oauth-clients.form.scopesDescription")}
                      error={
                        isInvalid && field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : null
                      }
                    >
                      <div className="space-y-2">
                        {KNOWN_SCOPES.map((scope) => {
                          const checked = field.state.value.includes(scope)
                          return (
                            <label
                              key={scope}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => {
                                  if (nextChecked) {
                                    field.handleChange([
                                      ...field.state.value,
                                      scope,
                                    ])
                                  } else {
                                    field.handleChange(
                                      field.state.value.filter(
                                        (s) => s !== scope
                                      )
                                    )
                                  }
                                }}
                              />
                              <span className="font-mono text-sm">{scope}</span>
                            </label>
                          )
                        })}
                      </div>
                    </LabelField>
                  )
                }}
              </form.Field>

              {/* Status (update only) */}
              {mode === "update" ? (
                <form.Field name="status">
                  {(field) => (
                    <LabelField
                      label={t("oauth-clients.form.statusLabel")}
                      htmlFor={field.name}
                    >
                      <Select
                        value={field.state.value}
                        onValueChange={(val) =>
                          field.handleChange(Number(val) as OAuthClientStatus)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabelField>
                  )}
                </form.Field>
              ) : null}

              {/* Description */}
              <form.Field name="description">
                {(field) => (
                  <LabelField
                    label={t("oauth-clients.form.descriptionLabel")}
                    htmlFor={field.name}
                  >
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("oauth-clients.form.descriptionPlaceholder")}
                      rows={2}
                    />
                  </LabelField>
                )}
              </form.Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t border-border/60 bg-muted/20 px-5 py-4">
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isBusy}
              >
                {t("oauth-clients.sheet.cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isBusy}>
                {isBusy ? (
                  <Spinner className="size-3.5" />
                ) : null}
                {t("oauth-clients.sheet.submit")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
