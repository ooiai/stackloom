"use client"

import { useMemo } from "react"

import { useForm } from "@tanstack/react-form"
import { getDefaultFormValues, getValidationSchema } from "../helpers"
import { useI18n } from "@/providers/i18n-provider"
import type {
  OAuthClientData,
  OAuthClientFormValues,
  OAuthClientMutateMode,
} from "@/types/base.types"

export function useOAuthClientMutateForm({
  mode,
  client,
  onSubmit,
}: {
  mode: OAuthClientMutateMode
  client: OAuthClientData | null
  onSubmit: (values: OAuthClientFormValues) => Promise<void>
}) {
  const { t } = useI18n()
  const defaultValues = useMemo(
    () => getDefaultFormValues(client, mode),
    [client, mode]
  )
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

export type OAuthClientMutateFormApi = ReturnType<
  typeof useOAuthClientMutateForm
>["form"]
