import { hash } from "bcryptjs"
import { z } from "zod"

import type {
  CreateUserParam,
  UpdateUserParam,
  UserData,
  UserFormValues,
  UserMutateMode,
  UserStatus,
} from "@/types/base.types"
import type { BadgeProps } from "@/components/reui/badge"

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255, "邮箱长度不能超过 255 个字符")
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "请输入有效的邮箱地址",
  })
  .transform((value) => (value === "" ? undefined : value))

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(20, "手机号长度不能超过 20 个字符")
  .transform((value) => (value === "" ? undefined : value))

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      z.url({
        protocol: /^https?$/,
        hostname: z.regexes.domain,
      }).safeParse(value).success,
    {
      message: "请输入有效的头像地址",
    }
  )
  .transform((value) => (value === "" ? undefined : value))

const optionalNicknameSchema = z
  .string()
  .trim()
  .max(100, "昵称长度不能超过 100 个字符")
  .transform((value) => (value === "" ? undefined : value))

const optionalBioSchema = z
  .string()
  .trim()
  .max(2000, "简介长度不能超过 2000 个字符")
  .transform((value) => (value === "" ? undefined : value))

const commonUserFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "请输入用户名")
    .max(50, "用户名长度不能超过 50 个字符"),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  nickname: optionalNicknameSchema,
  avatar_url: optionalUrlSchema,
  gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  bio: optionalBioSchema,
})

const createUserFormSchema = commonUserFormSchema.extend({
  password: z
    .string()
    .min(8, "密码至少需要 8 位")
    .max(72, "密码长度不能超过 72 位"),
})

const updateUserFormSchema = commonUserFormSchema

function normalizeOptionalUpdateValue(
  rawValue: string,
  parsedValue: string | undefined
) {
  if (rawValue.trim() === "") {
    return null
  }

  return parsedValue
}

type ValidationSchema =
  | typeof createUserFormSchema
  | typeof updateUserFormSchema

type UserStatusMeta = {
  label: string
  description: string
  badgeVariant: BadgeProps["variant"]
}

const USER_STATUS_META_MAP: Record<UserStatus, UserStatusMeta> = {
  0: {
    label: "禁用",
    description: "账号已停用，不允许继续访问系统。",
    badgeVariant: "destructive-outline",
  },
  1: {
    label: "正常",
    description: "账号可正常登录和使用。",
    badgeVariant: "success-outline",
  },
  2: {
    label: "锁定",
    description: "账号被锁定，需要管理员确认。",
    badgeVariant: "warning-outline",
  },
}

export const USER_STATUS_OPTIONS = (Object.keys(USER_STATUS_META_MAP) as Array<
  `${UserStatus}`
>).map((key) => ({
  value: Number(key) as UserStatus,
  label: USER_STATUS_META_MAP[Number(key) as UserStatus].label,
}))

export const USER_GENDER_OPTIONS = [
  { value: 0 as const, label: "未知" },
  { value: 1 as const, label: "男" },
  { value: 2 as const, label: "女" },
]

function getValidationSchema(mode: UserMutateMode): ValidationSchema {
  return mode === "create" ? createUserFormSchema : updateUserFormSchema
}

export function getUserStatusMeta(status: UserStatus): UserStatusMeta {
  return USER_STATUS_META_MAP[status] ?? USER_STATUS_META_MAP[1]
}

export function getUserDisplayName(
  user: Pick<UserData, "nickname" | "username">
) {
  return user.nickname?.trim() || user.username
}

export function getUserAvatarFallback(
  user: Pick<UserData, "nickname" | "username"> | Pick<UserFormValues, "nickname" | "username">
) {
  const displayName = getUserDisplayName({
    nickname: user.nickname,
    username: user.username,
  })

  return displayName.slice(0, 1).toUpperCase()
}

export function getDefaultUserFormValues(user: UserData | null): UserFormValues {
  return {
    username: user?.username ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    password: "",
    nickname: user?.nickname ?? "",
    avatar_url: user?.avatar_url ?? "",
    gender: user?.gender ?? 0,
    status: user?.status ?? 1,
    bio: user?.bio ?? "",
  }
}

export function validateUserForm(
  mode: UserMutateMode,
  values: UserFormValues
) {
  const result = getValidationSchema(mode).safeParse(values)

  if (result.success) {
    return {}
  }

  const fieldErrors = result.error.flatten().fieldErrors

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([key, messages]) => [key, messages?.[0]])
  ) as Partial<Record<keyof UserFormValues, string>>
}

export async function buildCreateUserParam(
  values: UserFormValues
): Promise<CreateUserParam> {
  const parsed = createUserFormSchema.parse(values)

  return {
    username: parsed.username,
    email: parsed.email,
    phone: parsed.phone,
    password_hash: await hash(parsed.password, 10),
    nickname: parsed.nickname,
    avatar_url: parsed.avatar_url,
    gender: parsed.gender,
    status: parsed.status,
    bio: parsed.bio,
  }
}

export function buildUpdateUserParam(
  id: string,
  values: UserFormValues
): UpdateUserParam {
  const parsed = updateUserFormSchema.parse(values)

  return {
    id,
    email: normalizeOptionalUpdateValue(values.email, parsed.email),
    phone: normalizeOptionalUpdateValue(values.phone, parsed.phone),
    nickname: normalizeOptionalUpdateValue(values.nickname, parsed.nickname),
    avatar_url: normalizeOptionalUpdateValue(
      values.avatar_url,
      parsed.avatar_url
    ),
    gender: parsed.gender,
    status: parsed.status,
    bio: normalizeOptionalUpdateValue(values.bio, parsed.bio),
  }
}
