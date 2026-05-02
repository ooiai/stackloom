"use client"

import { useMemo } from "react"

import {
  createPermFormSchema,
  getDefaultPermFormValues,
} from "@/components/base/perms/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  PermData,
  PermFormValues,
  PermMutateMode,
} from "@/types/base.types"
import { useForm } from "@tanstack/react-form"

export function usePermMutateForm({
  mode,
  perm,
  parent,
  onSubmit,
}: {
  mode: PermMutateMode
  perm: PermData | null
  parent: PermData | null
  onSubmit: (values: PermFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultPermFormValues(perm, parent),
    [perm, parent]
  )
  const schema = useMemo(() => createPermFormSchema(t), [t])

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
    mode,
  }
}

export type PermMutateFormApi = ReturnType<typeof usePermMutateForm>["form"]
