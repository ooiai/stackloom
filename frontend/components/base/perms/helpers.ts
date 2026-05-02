import { z } from "zod"

import type { BadgeProps } from "@/components/reui/badge"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreatePermParam,
  PermData,
  PermFormValues,
  PermStatus,
  PermTreeNodeData,
  UpdatePermParam,
} from "@/types/base.types"

const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

export type PermTreeNode = PermTreeNodeData

type PermStatusMeta = {
  label: string
  badgeVariant: BadgeProps["variant"]
}

function sortPermNodes(a: PermData, b: PermData) {
  if (a.sort !== b.sort) {
    return a.sort - b.sort
  }

  return a.name.localeCompare(b.name, "zh-CN")
}

export function createPermFormSchema(t: TranslateFn = defaultT) {
  const optionalText = (max: number, invalid: string) =>
    z
      .string()
      .trim()
      .max(max, invalid)
      .transform((value) => (value === "" ? undefined : value))

  return z.object({
    tenant_id: z.string().nullable().optional(),
    parent_id: z.string().nullable().optional(),
    code: z
      .string()
      .trim()
      .min(1, t("perms.form.code.validation.required"))
      .max(100, t("perms.form.code.validation.max")),
    name: z
      .string()
      .trim()
      .min(1, t("perms.form.name.validation.required"))
      .max(100, t("perms.form.name.validation.max")),
    resource: optionalText(255, t("perms.form.resource.validation.max")),
    action: optionalText(100, t("perms.form.action.validation.max")),
    description: optionalText(500, t("perms.form.description.validation.max")),
    sort: z
      .number()
      .int(t("perms.form.sort.validation.int"))
      .min(0, t("perms.form.sort.validation.min"))
      .max(9999, t("perms.form.sort.validation.max")),
    status: z.union([z.literal(0), z.literal(1)]),
  })
}

export function getPermStatusMeta(
  status: PermStatus,
  t: TranslateFn = defaultT
): PermStatusMeta {
  const map: Record<PermStatus, PermStatusMeta> = {
    0: {
      label: t("perms.status.disabled.label"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("perms.status.active.label"),
      badgeVariant: "success-outline",
    },
  }

  return map[status] ?? map[1]
}

export function buildPermTree(items: PermData[]) {
  const sortedItems = [...items].sort(sortPermNodes)
  const nodeMap = new Map<string, PermTreeNode>()
  const roots: PermTreeNode[] = []

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

export function findPermNode(
  nodes: PermTreeNode[],
  id: string
): PermTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    const found = findPermNode(node.children, id)
    if (found) {
      return found
    }
  }

  return null
}

export function buildPermBreadcrumb(
  nodes: PermTreeNode[],
  targetId: string,
  path: PermTreeNode[] = []
): PermTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]

    if (node.id === targetId) {
      return nextPath
    }

    const found = buildPermBreadcrumb(node.children, targetId, nextPath)
    if (found) {
      return found
    }
  }

  return null
}

export function getDefaultPermFormValues(
  perm: PermData | null,
  parent: PermData | null
): PermFormValues {
  return {
    tenant_id: perm?.tenant_id ?? parent?.tenant_id ?? null,
    parent_id: perm?.parent_id ?? parent?.id ?? null,
    code: perm?.code ?? "",
    name: perm?.name ?? "",
    resource: perm?.resource ?? "",
    action: perm?.action ?? "",
    description: perm?.description ?? "",
    sort: perm?.sort ?? 0,
    status: perm?.status ?? 1,
  }
}

export function buildCreatePermParam(
  values: PermFormValues,
  t: TranslateFn = defaultT
): CreatePermParam {
  const parsed = createPermFormSchema(t).parse(values)

  return {
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    resource: parsed.resource,
    action: parsed.action,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
  }
}

export function buildUpdatePermParam(
  id: string,
  values: PermFormValues,
  t: TranslateFn = defaultT
): UpdatePermParam {
  const parsed = createPermFormSchema(t).parse(values)

  return {
    id,
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    resource: parsed.resource,
    action: parsed.action,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
  }
}
