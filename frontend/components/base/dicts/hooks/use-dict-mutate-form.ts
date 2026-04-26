"use client"

import { useMemo } from "react"

import {
  createDictFormSchema,
  getDefaultDictFormValues,
} from "@/components/base/dicts/helpers"
import { useForm } from "@tanstack/react-form"
import { useI18n } from "@/providers/i18n-provider"
import type {
  DictData,
  DictFormValues,
  DictMutateMode,
} from "@/types/base.types"

export function useDictMutateForm({
  mode,
  dict,
  parent,
  onSubmit,
}: {
  mode: DictMutateMode
  dict: DictData | null
  parent: DictData | null
  onSubmit: (values: DictFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultDictFormValues(dict, parent),
    [dict, parent]
  )
  const schema = useMemo(() => createDictFormSchema(t), [t])

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

export type DictMutateFormApi = ReturnType<typeof useDictMutateForm>["form"]
