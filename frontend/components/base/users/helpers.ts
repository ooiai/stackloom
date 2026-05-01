import { z } from "zod"

import CryptUtil from "@/lib/crypt"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateUserParam,
  UpdateUserParam,
  UserData,
  UserFormValues,
  UserMutateMode,
  UserStatus,
} from "@/types/base.types"
import type { BadgeProps } from "@/components/reui/badge"

const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

function normalizeOptionalUpdateValue(
  rawValue: string,
  parsedValue: string | undefined
) {
  if (rawValue.trim() === "") {
    return null
  }

  return parsedValue
}

type UserFormSchema =
  | ReturnType<typeof createUserFormSchema>
  | ReturnType<typeof createUserUpdateSchema>

type UserStatusMeta = {
  label: string
  description: string
  badgeVariant: BadgeProps["variant"]
}

function createOptionalEmailSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .max(255, t("users.form.email.validation.max"))
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: t("users.form.email.validation.invalid"),
    })
    .transform((value) => (value === "" ? undefined : value))
}

function createOptionalPhoneSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .max(20, t("users.form.phone.validation.max"))
    .transform((value) => (value === "" ? undefined : value))
}

function createOptionalUrlSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        z
          .url({
            protocol: /^https?$/,
            hostname: z.regexes.domain,
          })
          .safeParse(value).success,
      {
        message: t("users.form.avatar.validation.invalid"),
      }
    )
    .transform((value) => (value === "" ? undefined : value))
}

function createOptionalNicknameSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .max(100, t("users.form.nickname.validation.max"))
    .transform((value) => (value === "" ? undefined : value))
}

function createOptionalBioSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .max(2000, t("users.form.bio.validation.max"))
    .transform((value) => (value === "" ? undefined : value))
}

export function createUserFormSchema(t: TranslateFn = defaultT) {
  const commonUserFormSchema = z.object({
    username: z
      .string()
      .trim()
      .min(1, t("users.form.username.validation.required"))
      .max(50, t("users.form.username.validation.max")),
    email: createOptionalEmailSchema(t),
    phone: createOptionalPhoneSchema(t),
    nickname: createOptionalNicknameSchema(t),
    avatar_url: createOptionalUrlSchema(t),
    gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    bio: createOptionalBioSchema(t),
  })

  return commonUserFormSchema.extend({
    password: z
      .string()
      .min(8, t("users.form.password.validation.min"))
      .max(72, t("users.form.password.validation.max")),
  })
}

export function createUserUpdateSchema(t: TranslateFn = defaultT) {
  return createUserFormSchema(t).extend({
    password: z.string(),
  })
}

export function getValidationSchema(
  mode: UserMutateMode,
  t: TranslateFn = defaultT
): UserFormSchema {
  return mode === "create" ? createUserFormSchema(t) : createUserUpdateSchema(t)
}

export function getUserStatusMeta(
  status: UserStatus,
  t: TranslateFn = defaultT
): UserStatusMeta {
  const statusMap: Record<UserStatus, UserStatusMeta> = {
    0: {
      label: t("users.status.disabled.label"),
      description: t("users.status.disabled.description"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("users.status.active.label"),
      description: t("users.status.active.description"),
      badgeVariant: "success-outline",
    },
    2: {
      label: t("users.status.locked.label"),
      description: t("users.status.locked.description"),
      badgeVariant: "warning-outline",
    },
  }

  return statusMap[status] ?? statusMap[1]
}

export function getUserStatusOptions(t: TranslateFn = defaultT) {
  return (
    Object.keys({ 0: true, 1: true, 2: true }) as Array<`${UserStatus}`>
  ).map((key) => ({
    value: Number(key) as UserStatus,
    label: getUserStatusMeta(Number(key) as UserStatus, t).label,
  }))
}

export function getUserGenderOptions(t: TranslateFn = defaultT) {
  return [
    { value: 0 as const, label: t("users.gender.unknown") },
    { value: 1 as const, label: t("users.gender.male") },
    { value: 2 as const, label: t("users.gender.female") },
  ]
}

export function getUserDisplayName(
  user: Pick<UserData, "nickname" | "username">
) {
  return user.nickname?.trim() || user.username
}

export function getUserAvatarFallback(
  user:
    | Pick<UserData, "nickname" | "username">
    | Pick<UserFormValues, "nickname" | "username">
) {
  const displayName = getUserDisplayName({
    nickname: user.nickname,
    username: user.username,
  })

  return displayName.slice(0, 1).toUpperCase()
}

export function getDefaultUserFormValues(
  user: UserData | null
): UserFormValues {
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
  values: UserFormValues,
  t: TranslateFn = defaultT
) {
  const result = getValidationSchema(mode, t).safeParse(values)

  if (result.success) {
    return {}
  }

  const fieldErrors = result.error.flatten().fieldErrors

  return Object.fromEntries(
    Object.entries(
      fieldErrors as Partial<Record<keyof UserFormValues, string[] | undefined>>
    )
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([key, messages]) => [key, messages[0]])
  ) as Partial<Record<keyof UserFormValues, string>>
}

export async function buildCreateUserParam(
  values: UserFormValues,
  t: TranslateFn = defaultT
): Promise<CreateUserParam> {
  const parsed = createUserFormSchema(t).parse(values)

  return {
    username: parsed.username,
    email: parsed.email,
    phone: parsed.phone,
    password_hash: CryptUtil.md5Double(parsed.password),
    nickname: parsed.nickname,
    avatar_url: parsed.avatar_url,
    gender: parsed.gender,
    status: parsed.status,
    bio: parsed.bio,
  }
}

export function buildUpdateUserParam(
  id: string,
  values: UserFormValues,
  t: TranslateFn = defaultT
): UpdateUserParam {
  const parsed = createUserUpdateSchema(t).parse(values)

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
