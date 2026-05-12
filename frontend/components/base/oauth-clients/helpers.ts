import { z } from "zod"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateOAuthClientParam,
  OAuthClientData,
  OAuthClientFormValues,
  OAuthClientMutateMode,
  OAuthClientStatus,
  UpdateOAuthClientParam,
} from "@/types/base.types"

export const OAUTH_CLIENT_ACTION_PERMS = {
  create: "OAUTH::CLIENT::CREATE",
  update: "OAUTH::CLIENT::UPDATE",
  rotateSecret: "OAUTH::CLIENT::ROTATE_SECRET",
  remove: "OAUTH::CLIENT::REMOVE",
} as const

export const KNOWN_SCOPES = [
  "user:read",
  "itembank:read",
  "itembank:write",
  "parse:create",
  "parse:read",
] as const

export const DEFAULT_FORM_VALUES: OAuthClientFormValues = {
  name: "",
  client_secret: "",
  redirect_uris: "",
  allowed_scopes: [],
  description: "",
  status: 1,
}

export function getDefaultFormValues(
  client: OAuthClientData | null,
  mode: OAuthClientMutateMode
): OAuthClientFormValues {
  if (mode === "update" && client) {
    return {
      name: client.name,
      client_secret: "",
      redirect_uris: client.redirect_uris.join("\n"),
      allowed_scopes: client.allowed_scopes,
      description: client.description ?? "",
      status: client.status,
    }
  }
  return DEFAULT_FORM_VALUES
}

export function parseRedirectUris(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function createOAuthClientSchema(t: TranslateFn) {
  return z.object({
    name: z.string().min(1, t("oauth-clients.form.nameLabel")),
    client_secret: z.string().min(16, "Client Secret 至少 16 位"),
    redirect_uris: z.string().min(1, "请填写至少一个重定向 URI"),
    allowed_scopes: z.array(z.string()).min(1, "请选择至少一个授权范围"),
    description: z.string(),
    status: z.union([z.literal(0), z.literal(1)]),
  })
}

export function createUpdateOAuthClientSchema(t: TranslateFn) {
  return z.object({
    name: z.string().min(1, t("oauth-clients.form.nameLabel")),
    client_secret: z.string(),
    redirect_uris: z.string(),
    allowed_scopes: z.array(z.string()),
    description: z.string(),
    status: z.union([z.literal(0), z.literal(1)]),
  })
}

export function getValidationSchema(
  mode: OAuthClientMutateMode,
  t: TranslateFn
) {
  return mode === "create"
    ? createOAuthClientSchema(t)
    : createUpdateOAuthClientSchema(t)
}

export function buildCreateParam(
  values: OAuthClientFormValues
): CreateOAuthClientParam {
  return {
    name: values.name.trim(),
    client_secret: values.client_secret,
    redirect_uris: parseRedirectUris(values.redirect_uris),
    allowed_scopes: values.allowed_scopes,
    description: values.description.trim() || undefined,
  }
}

export function buildUpdateParam(
  id: string,
  values: OAuthClientFormValues
): UpdateOAuthClientParam {
  return {
    id,
    name: values.name.trim() || undefined,
    redirect_uris: parseRedirectUris(values.redirect_uris),
    allowed_scopes: values.allowed_scopes,
    status: values.status,
    description: values.description.trim() || undefined,
  }
}

export function getStatusVariant(status: OAuthClientStatus) {
  return status === 1 ? ("success" as const) : ("secondary" as const)
}

export function getOAuthClientStatusOptions(t: TranslateFn) {
  return [
    { value: 1 as OAuthClientStatus, label: t("oauth-clients.status.enabled") },
    {
      value: 0 as OAuthClientStatus,
      label: t("oauth-clients.status.disabled"),
    },
  ]
}
