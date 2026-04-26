"use client"

import { useMemo } from "react"

import { useForm } from "@tanstack/react-form"
import { z } from "zod"

import { getDefaultUserFormValues } from "@/lib/users"
import type {
  UserData,
  UserFormValues,
  UserMutateMode,
} from "@/types/base.types"

const userFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(50, "用户名长度不能超过 50 个字符"),
  email: z.union([
    z.literal(""),
    z.email("请输入有效的邮箱地址").max(255, "邮箱长度不能超过 255 个字符"),
  ]),
  phone: z.string().trim().max(20, "手机号长度不能超过 20 个字符"),
  nickname: z.string().trim().max(100, "昵称长度不能超过 100 个字符"),
  avatar_url: z.union([
    z.literal(""),
    z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      message: "请输入有效的头像地址",
    }),
  ]),
  gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  bio: z.string().trim().max(2000, "简介长度不能超过 2000 个字符"),
})

const createUserFormSchema = userFormSchema.extend({
  password: z
    .string()
    .min(8, "密码至少需要 8 位")
    .max(72, "密码长度不能超过 72 位"),
})

const updateUserFormSchema = userFormSchema.extend({
  password: z.string(),
})

function getUserMutateSchema(mode: UserMutateMode) {
  return mode === "create" ? createUserFormSchema : updateUserFormSchema
}

export function useUserMutateForm({
  mode,
  user,
  onSubmit,
}: {
  mode: UserMutateMode
  user: UserData | null
  onSubmit: (values: UserFormValues) => Promise<void>
}) {
  const defaultValues = useMemo(() => getDefaultUserFormValues(user), [user])
  const schema = useMemo(() => getUserMutateSchema(mode), [mode])

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
