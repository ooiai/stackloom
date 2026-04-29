"use client"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/reui/select"
import { Textarea } from "@/components/reui/textarea"
import { LabelField } from "@/components/topui/label-field"
import {
  UserMutateAccountSection,
  UserMutateProfileSection,
} from "@/components/base/users/user-mutate-sheet-sections"
import type { UserMutateFormApi } from "@/components/base/users/hooks/use-user-mutate-form"
import { cn } from "@/lib/utils"
import { getUserGenderOptions, getUserStatusOptions } from "./helpers"
import { useI18n } from "@/providers/i18n-provider"
import type { UserMutateMode } from "@/types/base.types"
import { EyeIcon, EyeOffIcon } from "lucide-react"

interface UserMutateFormFieldsProps {
  form: UserMutateFormApi
  mode: UserMutateMode
  showPassword: boolean
  onTogglePassword: () => void
}

export function UserMutateFormFields({
  form,
  mode,
  showPassword,
  onTogglePassword,
}: UserMutateFormFieldsProps) {
  const { t } = useI18n()
  const genderOptions = getUserGenderOptions(t)
  const statusOptions = getUserStatusOptions(t)
  const genderLabelMap = Object.fromEntries(
    genderOptions.map((option) => [option.value, option.label])
  ) as Record<0 | 1 | 2, string>
  const statusLabelMap = Object.fromEntries(
    statusOptions.map((option) => [option.value, option.label])
  ) as Record<0 | 1 | 2, string>

  return (
    <>
      <UserMutateAccountSection>
        <form.Field name="username">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                className="md:col-span-2"
                label={t("users.form.username.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  disabled={mode === "update"}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("users.form.username.placeholder")}
                  className={cn(
                    "transition-colors",
                    mode === "update" &&
                      "cursor-not-allowed bg-muted/50 text-muted-foreground"
                  )}
                />
              </LabelField>
            )
          }}
        </form.Field>

        <form.Field name="nickname">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                className="md:col-span-2"
                label={t("users.form.nickname.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("users.form.nickname.placeholder")}
                />
              </LabelField>
            )
          }}
        </form.Field>

        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                className="md:col-span-2"
                label={t("users.form.email.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="name@example.com"
                />
              </LabelField>
            )
          }}
        </form.Field>

        <form.Field name="phone">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                className="md:col-span-2"
                label={t("users.form.phone.label")}
                htmlFor={field.name}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder={t("users.form.phone.placeholder")}
                />
              </LabelField>
            )
          }}
        </form.Field>

        {mode === "create" ? (
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <LabelField
                  className="md:col-span-2"
                  label={t("users.form.password.label")}
                  htmlFor={field.name}
                  invalid={isInvalid}
                  tooltip={{ content: t("users.form.password.tooltip") }}
                  error={
                    isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null
                  }
                >
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder={t("users.form.password.placeholder")}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                      onClick={onTogglePassword}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                      <span className="sr-only">
                        {showPassword
                          ? t("users.form.password.hide")
                          : t("users.form.password.show")}
                      </span>
                    </Button>
                  </div>
                </LabelField>
              )
            }}
          </form.Field>
        ) : null}
      </UserMutateAccountSection>

      <UserMutateProfileSection>
        <form.Field name="gender">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                label={t("users.form.gender.label")}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Select
                  name={field.name}
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1 | 2)
                  }
                >
                  <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                    <SelectValue>
                      {genderLabelMap[field.state.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabelField>
            )
          }}
        </form.Field>

        <form.Field name="status">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <LabelField
                label={t("users.form.status.label")}
                invalid={isInvalid}
                error={
                  isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null
                }
              >
                <Select
                  name={field.name}
                  value={String(field.state.value)}
                  onValueChange={(value) =>
                    field.handleChange(Number(value) as 0 | 1 | 2)
                  }
                >
                  <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                    <SelectValue>
                      {statusLabelMap[field.state.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </LabelField>
            )
          }}
        </form.Field>
      </UserMutateProfileSection>

      <form.Field name="bio">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const bioLength = field.state.value.trim().length

          return (
            <LabelField
              label={t("users.form.bio.label")}
              htmlFor={field.name}
              invalid={isInvalid}
              description={
                <span
                  className={cn(
                    "block text-right text-xs tabular-nums transition-colors",
                    bioLength > 1800
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  {bioLength}/2000
                </span>
              }
              error={
                isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null
              }
            >
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                placeholder={t("users.form.bio.placeholder")}
                className="min-h-28 resize-y text-[12px] leading-6"
              />
            </LabelField>
          )
        }}
      </form.Field>
    </>
  )
}
