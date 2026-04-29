import { z } from "zod"

import type { BadgeProps } from "@/components/reui/badge"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateTenantParam,
  TenantData,
  TenantFormValues,
  TenantStatus,
  TenantTreeNodeData,
  UpdateTenantParam,
} from "@/types/base.types"

const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

export type TenantTreeNode = TenantTreeNodeData

type TenantStatusMeta = {
  label: string
  badgeVariant: BadgeProps["variant"]
}

function sortTenantNodes(a: TenantData, b: TenantData) {
  return a.name.localeCompare(b.name, "zh-CN")
}

export function createTenantFormSchema(t: TranslateFn = defaultT) {
  const optionalText = (max: number, invalid: string) =>
    z.string().trim().max(max, invalid)

  return z.object({
    parent_id: z.string().nullable().optional(),
    slug: z
      .string()
      .trim()
      .min(1, t("tenants.form.slug.validation.required"))
      .max(100, t("tenants.form.slug.validation.max")),
    name: z
      .string()
      .trim()
      .min(1, t("tenants.form.name.validation.required"))
      .max(100, t("tenants.form.name.validation.max")),
    description: optionalText(
      500,
      t("tenants.form.description.validation.max")
    ),
    owner_user_id: z.string().trim(),
    status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    plan_code: optionalText(100, t("tenants.form.plan_code.validation.max")),
    expired_at: z.string().trim(),
  })
}

export function getTenantStatusMeta(
  status: TenantStatus,
  t: TranslateFn = defaultT
): TenantStatusMeta {
  const map: Record<TenantStatus, TenantStatusMeta> = {
    0: {
      label: t("tenants.status.disabled.label"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("tenants.status.active.label"),
      badgeVariant: "success-outline",
    },
    2: {
      label: t("tenants.status.expired.label"),
      badgeVariant: "warning-outline",
    },
  }

  return map[status] ?? map[1]
}

export function buildTenantTree(items: TenantData[]) {
  const sortedItems = [...items].sort(sortTenantNodes)
  const nodeMap = new Map<string, TenantTreeNode>()
  const roots: TenantTreeNode[] = []

  for (const item of sortedItems) {
    nodeMap.set(item.id, { ...item, children: [] })
  }

  for (const item of sortedItems) {
    const currentNode = nodeMap.get(item.id)
    if (!currentNode) {
      continue
    }

    if (item.parent_id && nodeMap.has(item.parent_id)) {
      nodeMap.get(item.parent_id)?.children.push(currentNode)
      continue
    }

    roots.push(currentNode)
  }

  return roots
}

export function findTenantNode(
  nodes: TenantTreeNode[],
  id: string
): TenantTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    const found = findTenantNode(node.children, id)
    if (found) {
      return found
    }
  }

  return null
}

export function buildTenantBreadcrumb(
  nodes: TenantTreeNode[],
  targetId: string,
  path: TenantTreeNode[] = []
): TenantTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]

    if (node.id === targetId) {
      return nextPath
    }

    const found = buildTenantBreadcrumb(node.children, targetId, nextPath)
    if (found) {
      return found
    }
  }

  return null
}

export function getDefaultTenantFormValues(
  tenant: TenantData | null,
  parent: TenantData | null
): TenantFormValues {
  return {
    parent_id: tenant?.parent_id ?? parent?.id ?? null,
    slug: tenant?.slug ?? "",
    name: tenant?.name ?? "",
    description: tenant?.description ?? "",
    owner_user_id: tenant?.owner_user_id ?? "",
    status: tenant?.status ?? 1,
    plan_code: tenant?.plan_code ?? "",
    expired_at: tenant?.expired_at ?? "",
  }
}

export function buildCreateTenantParam(
  values: TenantFormValues,
  t: TranslateFn = defaultT
): CreateTenantParam {
  const parsed = createTenantFormSchema(t).parse(values)

  return {
    parent_id: parsed.parent_id ?? null,
    slug: parsed.slug,
    name: parsed.name,
    description: parsed.description || undefined,
    owner_user_id: parsed.owner_user_id || null,
    status: parsed.status,
    plan_code: parsed.plan_code || undefined,
    expired_at: parsed.expired_at || null,
  }
}

export function buildUpdateTenantParam(
  id: string,
  values: TenantFormValues,
  t: TranslateFn = defaultT
): UpdateTenantParam {
  const parsed = createTenantFormSchema(t).parse(values)

  return {
    id,
    parent_id: parsed.parent_id ?? null,
    slug: parsed.slug,
    name: parsed.name,
    description: parsed.description || undefined,
    owner_user_id: parsed.owner_user_id || null,
    status: parsed.status,
    plan_code: parsed.plan_code || undefined,
    expired_at: parsed.expired_at || null,
  }
}
