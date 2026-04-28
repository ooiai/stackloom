"use client"

import { useMemo } from "react"

import {
  createMenuFormSchema,
  getDefaultMenuFormValues,
} from "@/components/base/menus/helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  MenuData,
  MenuFormValues,
  MenuMutateMode,
} from "@/types/base.types"
import { useForm } from "@tanstack/react-form"

export function useMenuMutateForm({
  mode,
  menu,
  parent,
  onSubmit,
}: {
  mode: MenuMutateMode
  menu: MenuData | null
  parent: MenuData | null
  onSubmit: (values: MenuFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultMenuFormValues(menu, parent),
    [menu, parent]
  )
  const schema = useMemo(() => createMenuFormSchema(t), [t])

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

export type MenuMutateFormApi = ReturnType<typeof useMenuMutateForm>["form"]
