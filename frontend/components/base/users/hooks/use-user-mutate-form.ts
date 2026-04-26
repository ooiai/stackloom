"use client"

import { useMemo } from "react"

import { useForm } from "@tanstack/react-form"
import { getDefaultUserFormValues } from "@/lib/users"
import { getValidationSchema } from "@/lib/users"
import { useI18n } from "@/providers/i18n-provider"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"

export function useUserMutateForm({
  mode,
  user,
  onSubmit,
}: {
  mode: UserMutateMode
  user: UserData | null
  onSubmit: (values: UserFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(() => getDefaultUserFormValues(user), [user])
  const schema = useMemo(() => getValidationSchema(mode, t), [mode, t])

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return {
    defaultValues,
    form,
  }
}

export type UserMutateFormApi = ReturnType<typeof useUserMutateForm>["form"]
