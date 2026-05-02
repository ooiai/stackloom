"use client"

import { useMemo } from "react"

import {
  createRoleFormSchema,
  getDefaultRoleFormValues,
} from "@/components/base/roles/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  RoleData,
  RoleFormValues,
  RoleMutateMode,
} from "@/types/base.types"
import { useForm } from "@tanstack/react-form"

export function useRoleMutateForm({
  mode,
  role,
  parent,
  onSubmit,
}: {
  mode: RoleMutateMode
  role: RoleData | null
  parent: RoleData | null
  onSubmit: (values: RoleFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultRoleFormValues(role, parent),
    [role, parent]
  )
  const schema = useMemo(() => createRoleFormSchema(t), [t])

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

export type RoleMutateFormApi = ReturnType<typeof useRoleMutateForm>["form"]
