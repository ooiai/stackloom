import { z } from "zod"

import type { TranslateFn } from "@/lib/i18n"
import type {
  CreateDictParam,
  DictData,
  DictFormValues,
  DictMutateMode,
  DictStatus,
  DictTreeNodeData,
  DictValueType,
  UpdateDictParam,
} from "@/types/base.types"
import type { BadgeProps } from "@/components/reui/badge"

export const DICT_ROOT_NODE_ID = "__dict_root__"

export type DictTreeNode = DictTreeNodeData

type DictStatusMeta = {
  label: string
  description: string
  badgeVariant: BadgeProps["variant"]
}
const defaultT: TranslateFn = (key, _values, fallback) => fallback ?? key

export function createDictFormSchema(t: TranslateFn = defaultT) {
  const optionalDescriptionSchema = z
    .string()
    .trim()
    .max(500, t("dicts.form.description.validation.max"))
    .transform((value) => (value === "" ? undefined : value))

  const optionalExtSchema = z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") {
        return true
      }

      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, t("dicts.form.ext.validation.invalid"))
    .transform((value) => (value === "" ? "{}" : value))

  return z.object({
    parent_id: z.string().nullable().optional(),
    dict_type: z
      .string()
      .trim()
      .min(1, t("dicts.form.type.validation.required"))
      .max(100, t("dicts.form.type.validation.max")),
    dict_key: z
      .string()
      .trim()
      .min(1, t("dicts.form.key.validation.required"))
      .max(100, t("dicts.form.key.validation.max")),
    dict_value: z
      .string()
      .trim()
      .min(1, t("dicts.form.value.validation.required"))
      .max(255, t("dicts.form.value.validation.max")),
    label: z
      .string()
      .trim()
      .min(1, t("dicts.form.label.validation.required"))
      .max(255, t("dicts.form.label.validation.max")),
    value_type: z.union([
      z.literal("string"),
      z.literal("number"),
      z.literal("boolean"),
      z.literal("json"),
    ]),
    description: optionalDescriptionSchema,
    sort: z
      .number()
      .int(t("dicts.form.sort.validation.int"))
      .min(0, t("dicts.form.sort.validation.min"))
      .max(9999, t("dicts.form.sort.validation.max")),
    status: z.union([z.literal(0), z.literal(1)]),
    is_builtin: z.boolean(),
    ext: optionalExtSchema,
  })
}

function sortDictNodes(a: DictData, b: DictData) {
  if (a.sort !== b.sort) {
    return a.sort - b.sort
  }

  return a.label.localeCompare(b.label, "zh-CN")
}

export function getDictStatusMeta(
  status: DictStatus,
  t: TranslateFn = defaultT
): DictStatusMeta {
  const statusMap: Record<DictStatus, DictStatusMeta> = {
    0: {
      label: t("dicts.status.disabled.label"),
      description: t("dicts.status.disabled.description"),
      badgeVariant: "destructive-outline",
    },
    1: {
      label: t("dicts.status.active.label"),
      description: t("dicts.status.active.description"),
      badgeVariant: "success-outline",
    },
  }

  return statusMap[status] ?? statusMap[1]
}

export function getDictStatusOptions(t: TranslateFn = defaultT) {
  return (Object.keys({ 0: true, 1: true }) as Array<`${DictStatus}`>).map(
    (key) => ({
      value: Number(key) as DictStatus,
      label: getDictStatusMeta(Number(key) as DictStatus, t).label,
    })
  )
}

export function getDictValueTypeOptions(
  t: TranslateFn = defaultT
): Array<{
  value: DictValueType
  label: string
  description: string
}> {
  return [
    {
      value: "string",
      label: t("dicts.valueType.string.label"),
      description: t("dicts.valueType.string.description"),
    },
    {
      value: "number",
      label: t("dicts.valueType.number.label"),
      description: t("dicts.valueType.number.description"),
    },
    {
      value: "boolean",
      label: t("dicts.valueType.boolean.label"),
      description: t("dicts.valueType.boolean.description"),
    },
    {
      value: "json",
      label: t("dicts.valueType.json.label"),
      description: t("dicts.valueType.json.description"),
    },
  ]
}

export function getDictDisplayName(dict: Pick<DictData, "label" | "dict_key">) {
  return dict.label?.trim() || dict.dict_key
}

export function buildDictTree(items: DictData[]) {
  const sortedItems = [...items].sort(sortDictNodes)
  const nodeMap = new Map<string, DictTreeNode>()
  const roots: DictTreeNode[] = []

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

export function findDictNode(
  nodes: DictTreeNode[],
  id: string
): DictTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    const found = findDictNode(node.children, id)
    if (found) {
      return found
    }
  }

  return null
}

export function buildDictBreadcrumb(
  nodes: DictTreeNode[],
  targetId: string,
  path: DictTreeNode[] = []
): DictTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]

    if (node.id === targetId) {
      return nextPath
    }

    const found = buildDictBreadcrumb(node.children, targetId, nextPath)
    if (found) {
      return found
    }
  }

  return null
}

export function collectDictDescendantIds(node: DictTreeNode): string[] {
  return [node.id, ...node.children.flatMap(collectDictDescendantIds)]
}

export function filterDictTree(nodes: DictTreeNode[], keyword: string) {
  const trimmed = keyword.trim().toLowerCase()
  if (!trimmed) {
    return nodes
  }

  function matches(node: DictTreeNode) {
    return (
      node.label.toLowerCase().includes(trimmed) ||
      node.dict_key.toLowerCase().includes(trimmed) ||
      node.dict_type.toLowerCase().includes(trimmed) ||
      node.dict_value.toLowerCase().includes(trimmed)
    )
  }

  function filterNode(node: DictTreeNode): DictTreeNode | null {
    const children = node.children
      .map(filterNode)
      .filter(Boolean) as DictTreeNode[]

    if (matches(node) || children.length > 0) {
      return { ...node, children }
    }

    return null
  }

  return nodes.map(filterNode).filter(Boolean) as DictTreeNode[]
}

export function getDirectDictChildren(
  items: DictData[],
  parentId: string | null
) {
  return items
    .filter((item) => (item.parent_id ?? null) === parentId)
    .sort(sortDictNodes)
}

export function getDefaultDictFormValues(
  dict: DictData | null,
  parent: DictData | null
): DictFormValues {
  return {
    parent_id: dict?.parent_id ?? parent?.id ?? null,
    dict_type: dict?.dict_type ?? parent?.dict_type ?? "",
    dict_key: dict?.dict_key ?? "",
    dict_value: dict?.dict_value ?? "",
    label: dict?.label ?? "",
    value_type: dict?.value_type ?? "string",
    description: dict?.description ?? "",
    sort: dict?.sort ?? 0,
    status: dict?.status ?? 1,
    is_builtin: dict?.is_builtin ?? false,
    ext: dict?.ext ?? "{}",
  }
}

export function validateDictForm(
  values: DictFormValues,
  t: TranslateFn = defaultT
) {
  const result = createDictFormSchema(t).safeParse(values)

  if (result.success) {
    return {}
  }

  const fieldErrors = result.error.flatten().fieldErrors

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([key, messages]) => [key, messages?.[0]])
  ) as Partial<Record<keyof DictFormValues, string>>
}

export function buildCreateDictParam(
  values: DictFormValues,
  t: TranslateFn = defaultT
): CreateDictParam {
  const parsed = createDictFormSchema(t).parse(values)

  return {
    parent_id: parsed.parent_id ?? null,
    dict_type: parsed.dict_type,
    dict_key: parsed.dict_key,
    dict_value: parsed.dict_value,
    label: parsed.label,
    value_type: parsed.value_type,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
    is_builtin: parsed.is_builtin,
    ext: parsed.ext,
  }
}

export function buildUpdateDictParam(
  id: string,
  values: DictFormValues,
  t: TranslateFn = defaultT
): UpdateDictParam {
  const parsed = createDictFormSchema(t).parse(values)

  return {
    id,
    dict_key: parsed.dict_key,
    dict_value: parsed.dict_value,
    label: parsed.label,
    value_type: parsed.value_type,
    description: parsed.description,
    sort: parsed.sort,
    status: parsed.status,
    is_builtin: parsed.is_builtin,
    ext: parsed.ext,
  }
}

export function getExpandedIdsForTree(nodes: DictTreeNode[]) {
  const ids = new Set<string>()

  function walk(branch: DictTreeNode[]) {
    for (const node of branch) {
      if (node.children.length > 0) {
        ids.add(node.id)
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return ids
}

export function getParentDictForSheet(
  mode: DictMutateMode,
  current: DictData | null,
  parent: DictData | null
) {
  if (mode === "update") {
    return parent
  }

  return parent
}
