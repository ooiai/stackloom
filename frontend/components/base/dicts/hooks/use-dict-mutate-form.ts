"use client"

import { useMemo } from "react"

import {
  dictFormSchema,
  getDefaultDictFormValues,
} from "@/components/base/dicts/helpers"
import { useForm } from "@tanstack/react-form"
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
  const defaultValues = useMemo(
    () => getDefaultDictFormValues(dict, parent),
    [dict, parent]
  )

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: dictFormSchema,
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
