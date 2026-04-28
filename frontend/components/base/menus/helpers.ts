import { z } from "zod"

import type { BadgeProps } from "@/components/reui/badge"
import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateMenuParam,
  MenuData,
  MenuFormValues,
  MenuStatus,
  MenuTreeNodeData,
  MenuType,
  UpdateMenuParam,
} from "@/types/base.types"

const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

export type MenuTreeNode = MenuTreeNodeData

type MenuStatusMeta = {
  label: string
  badgeVariant: BadgeProps["variant"]
}

type MenuTypeMeta = {
  label: string
  description: string
}

function sortMenuNodes(a: MenuData, b: MenuData) {
  if (a.sort !== b.sort) {
    return a.sort - b.sort
  }

  return a.name.localeCompare(b.name, "zh-CN")
}

export function createMenuFormSchema(t: TranslateFn = defaultT) {
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
      .min(1, t("menus.form.code.validation.required"))
      .max(100, t("menus.form.code.validation.max")),
    name: z
      .string()
      .trim()
      .min(1, t("menus.form.name.validation.required"))
      .max(100, t("menus.form.name.validation.max")),
    path: optionalText(255, t("menus.form.path.validation.max")),
    component: optionalText(255, t("menus.form.component.validation.max")),
    redirect: optionalText(255, t("menus.form.redirect.validation.max")),
    icon: optionalText(100, t("menus.form.icon.validation.max")),
    menu_type: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sort: z
      .number()
      .int(t("menus.form.sort.validation.int"))
      .min(0, t("menus.form.sort.validation.min"))
      .max(9999, t("menus.form.sort.validation.max")),
    visible: z.boolean(),
    keep_alive: z.boolean(),
    status: z.union([z.literal(0), z.literal(1)]),
  })
}

export function getMenuStatusMeta(
  status: MenuStatus,
  t: TranslateFn = defaultT
): MenuStatusMeta {
  const map: Record<MenuStatus, MenuStatusMeta> = {
    0: {
      label: t("menus.status.disabled.label"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("menus.status.active.label"),
      badgeVariant: "success-outline",
    },
  }

  return map[status] ?? map[1]
}

export function getMenuTypeOptions(t: TranslateFn = defaultT) {
  return [
    {
      value: 1 as MenuType,
      label: t("menus.type.directory.label"),
      description: t("menus.type.directory.description"),
    },
    {
      value: 2 as MenuType,
      label: t("menus.type.menu.label"),
      description: t("menus.type.menu.description"),
    },
    {
      value: 3 as MenuType,
      label: t("menus.type.action.label"),
      description: t("menus.type.action.description"),
    },
  ]
}

export function getMenuTypeMeta(
  type: MenuType,
  t: TranslateFn = defaultT
): MenuTypeMeta {
  return (
    getMenuTypeOptions(t).find((option) => option.value === type) ?? {
      label: t("menus.type.menu.label"),
      description: t("menus.type.menu.description"),
    }
  )
}

export function buildMenuTree(items: MenuData[]) {
  const sortedItems = [...items].sort(sortMenuNodes)
  const nodeMap = new Map<string, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

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

export function findMenuNode(
  nodes: MenuTreeNode[],
  id: string
): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    const found = findMenuNode(node.children, id)
    if (found) {
      return found
    }
  }

  return null
}

export function buildMenuBreadcrumb(
  nodes: MenuTreeNode[],
  targetId: string,
  path: MenuTreeNode[] = []
): MenuTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]

    if (node.id === targetId) {
      return nextPath
    }

    const found = buildMenuBreadcrumb(node.children, targetId, nextPath)
    if (found) {
      return found
    }
  }

  return null
}

export function getDefaultMenuFormValues(
  menu: MenuData | null,
  parent: MenuData | null
): MenuFormValues {
  return {
    tenant_id: menu?.tenant_id ?? parent?.tenant_id ?? null,
    parent_id: menu?.parent_id ?? parent?.id ?? null,
    code: menu?.code ?? "",
    name: menu?.name ?? "",
    path: menu?.path ?? "",
    component: menu?.component ?? "",
    redirect: menu?.redirect ?? "",
    icon: menu?.icon ?? "",
    menu_type: menu?.menu_type ?? 2,
    sort: menu?.sort ?? 0,
    visible: menu?.visible ?? true,
    keep_alive: menu?.keep_alive ?? false,
    status: menu?.status ?? 1,
  }
}

export function buildCreateMenuParam(
  values: MenuFormValues,
  t: TranslateFn = defaultT
): CreateMenuParam {
  const parsed = createMenuFormSchema(t).parse(values)

  return {
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    path: parsed.path,
    component: parsed.component,
    redirect: parsed.redirect,
    icon: parsed.icon,
    menu_type: parsed.menu_type,
    sort: parsed.sort,
    visible: parsed.visible,
    keep_alive: parsed.keep_alive,
    status: parsed.status,
  }
}

export function buildUpdateMenuParam(
  id: string,
  values: MenuFormValues,
  t: TranslateFn = defaultT
): UpdateMenuParam {
  const parsed = createMenuFormSchema(t).parse(values)

  return {
    id,
    tenant_id: parsed.tenant_id ?? null,
    parent_id: parsed.parent_id ?? null,
    code: parsed.code,
    name: parsed.name,
    path: parsed.path,
    component: parsed.component,
    redirect: parsed.redirect,
    icon: parsed.icon,
    menu_type: parsed.menu_type,
    sort: parsed.sort,
    visible: parsed.visible,
    keep_alive: parsed.keep_alive,
    status: parsed.status,
  }
}
