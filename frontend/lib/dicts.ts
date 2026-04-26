import { z } from "zod"

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

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, "说明长度不能超过 500 个字符")
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
  }, "扩展配置必须是合法 JSON")
  .transform((value) => (value === "" ? "{}" : value))

export const dictFormSchema = z.object({
  dict_type: z
    .string()
    .trim()
    .min(1, "请输入字典类型")
    .max(100, "字典类型长度不能超过 100 个字符"),
  dict_key: z
    .string()
    .trim()
    .min(1, "请输入字典键")
    .max(100, "字典键长度不能超过 100 个字符"),
  dict_value: z
    .string()
    .trim()
    .min(1, "请输入字典值")
    .max(255, "字典值长度不能超过 255 个字符"),
  label: z
    .string()
    .trim()
    .min(1, "请输入显示名称")
    .max(255, "显示名称长度不能超过 255 个字符"),
  value_type: z.union([
    z.literal("string"),
    z.literal("number"),
    z.literal("boolean"),
    z.literal("json"),
  ]),
  description: optionalDescriptionSchema,
  sort: z
    .number()
    .int("排序值必须是整数")
    .min(0, "排序值不能小于 0")
    .max(9999, "排序值不能超过 9999"),
  status: z.union([z.literal(0), z.literal(1)]),
  is_builtin: z.boolean(),
  ext: optionalExtSchema,
})

const DICT_STATUS_META_MAP: Record<DictStatus, DictStatusMeta> = {
  0: {
    label: "禁用",
    description: "该字典项已停用，不建议继续被业务侧使用。",
    badgeVariant: "destructive-outline",
  },
  1: {
    label: "正常",
    description: "该字典项可正常被选择和消费。",
    badgeVariant: "success-outline",
  },
}

export const DICT_STATUS_OPTIONS = (
  Object.keys(DICT_STATUS_META_MAP) as Array<`${DictStatus}`>
).map((key) => ({
  value: Number(key) as DictStatus,
  label: DICT_STATUS_META_MAP[Number(key) as DictStatus].label,
}))

export const DICT_VALUE_TYPE_OPTIONS: Array<{
  value: DictValueType
  label: string
  description: string
}> = [
  { value: "string", label: "字符串", description: "适合文案、编码和枚举值。" },
  { value: "number", label: "数字", description: "适合数字型业务值。" },
  { value: "boolean", label: "布尔", description: "适合 true / false 场景。" },
  { value: "json", label: "JSON", description: "适合结构化扩展值。" },
]

function sortDictNodes(a: DictData, b: DictData) {
  if (a.sort !== b.sort) {
    return a.sort - b.sort
  }

  return a.label.localeCompare(b.label, "zh-CN")
}

function parseOptionalId(value: string | null | undefined) {
  if (!value?.trim()) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }

  return parsed
}

export function getDictStatusMeta(status: DictStatus): DictStatusMeta {
  return DICT_STATUS_META_MAP[status] ?? DICT_STATUS_META_MAP[1]
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

export function validateDictForm(values: DictFormValues) {
  const result = dictFormSchema.safeParse(values)

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
  parentId?: string | null
): CreateDictParam {
  const parsed = dictFormSchema.parse(values)

  return {
    parent_id: parseOptionalId(parentId),
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
  values: DictFormValues
): UpdateDictParam {
  const parsed = dictFormSchema.parse(values)

  return {
    id,
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
