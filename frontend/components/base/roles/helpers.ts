import { z } from "zod"

import type { BadgeProps } from "@/components/reui/badge"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateRoleParam,
  RoleData,
  RoleFormValues,
  RoleStatus,
  RoleTreeNodeData,
  UpdateRoleParam,
} from "@/types/base.types"

const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

export type RoleTreeNode = RoleTreeNodeData

type RoleStatusMeta = {
  label: string
  badgeVariant: BadgeProps["variant"]
}

function sortRoleNodes(a: RoleData, b: RoleData) {
  if (a.sort !== b.sort) {
    return a.sort - b.sort
  }

  return a.name.localeCompare(b.name, "zh-CN")
}

export function createRoleFormSchema(t: TranslateFn = defaultT) {
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
      .min(1, t("roles.form.code.validation.required"))
      .max(100, t("roles.form.code.validation.max")),
    name: z
      .string()
      .trim()
      .min(1, t("roles.form.name.validation.required"))
      .max(100, t("roles.form.name.validation.max")),
    description: optionalText(500, t("roles.form.description.validation.max")),
    sort: z
      .number()
      .int(t("roles.form.sort.validation.int"))
      .min(0, t("roles.form.sort.validation.min"))
      .max(9999, t("roles.form.sort.validation.max")),
    status: z.union([z.literal(0), z.literal(1)]),
    is_builtin: z.boolean(),
  })
}

export function getRoleStatusMeta(
  status: RoleStatus,
  t: TranslateFn = defaultT
): RoleStatusMeta {
  const map: Record<RoleStatus, RoleStatusMeta> = {
    0: {
      label: t("roles.status.disabled.label"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("roles.status.active.label"),
      badgeVariant: "success-outline",
    },
  }

  return map[status] ?? map[1]
}

export function buildRoleTree(items: RoleData[]) {
  const sortedItems = [...items].sort(sortRoleNodes)
  const nodeMap = new Map<string, RoleTreeNode>()
  const roots: RoleTreeNode[] = []

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

export function findRoleNode(
  nodes: RoleTreeNode[],
  id: string
): RoleTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    const found = findRoleNode(node.children, id)
    if (found) {
      return found
    }
  }

  return null
}

export function buildRoleBreadcrumb(
  nodes: RoleTreeNode[],
  targetId: string,
  path: RoleTreeNode[] = []
): RoleTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]

    if (node.id === targetId) {
      return nextPath
    }

    const found = buildRoleBreadcrumb(node.children, targetId, nextPath)
    if (found) {
      return found
    }
  }

  return null
}

export function getDefaultRoleFormValues(
  role: RoleData | null,
  parent: RoleData | null
): RoleFormValues {
  return {
    tenant_id: role?.tenant_id ?? parent?.tenant_id ?? null,
    parent_id: role?.parent_id ?? parent?.id ?? null,
    code: role?.code ?? "",
    name: role?.name ?? "",
    description: role?.description ?? "",
    sort: role?.sort ?? 0,
    status: role?.status ?? 1,
    is_builtin: role?.is_builtin ?? false,
  }
}

export function buildCreateRoleParam(
  values: RoleFormValues,
  t: TranslateFn = defaultT
): CreateRoleParam {
  const parsed = createRoleFormSchema(t).parse(values)

  return {
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
    is_builtin: parsed.is_builtin,
  }
}

export function buildUpdateRoleParam(
  id: string,
  values: RoleFormValues,
  t: TranslateFn = defaultT
): UpdateRoleParam {
  const parsed = createRoleFormSchema(t).parse(values)

  return {
    id,
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
    is_builtin: parsed.is_builtin,
  }
}
