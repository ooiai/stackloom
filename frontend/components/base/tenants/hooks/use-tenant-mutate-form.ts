"use client"

import { useMemo } from "react"

import {
  createTenantFormSchema,
  getDefaultTenantFormValues,
} from "@/components/base/tenants/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  TenantData,
  TenantFormValues,
  TenantMutateMode,
} from "@/types/base.types"
import { useForm } from "@tanstack/react-form"

export function useTenantMutateForm({
  mode,
  tenant,
  parent,
  onSubmit,
}: {
  mode: TenantMutateMode
  tenant: TenantData | null
  parent: TenantData | null
  onSubmit: (values: TenantFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultTenantFormValues(tenant, parent),
    [parent, tenant]
  )
  const schema = useMemo(() => createTenantFormSchema(t), [t])

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

export type TenantMutateFormApi =
  ReturnType<typeof useTenantMutateForm>["form"]
