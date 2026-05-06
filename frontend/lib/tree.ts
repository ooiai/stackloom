export type MenuItem = {
  id: string
  pid: string
  name: string
  code: string
  icon: string
  path: string
  sort: number
  visible: number
  remark: string
}

export type MenuTreeNode = MenuItem & {
  children: MenuTreeNode[]
}

function normalizeMenuInput(input: unknown): MenuItem[] {
  if (Array.isArray(input)) return input as MenuItem[]
  if (input == null) return []
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      return normalizeMenuInput(parsed)
    } catch {
      console.warn("[buildMenuTree] input is string but not valid JSON")
      return []
    }
  }
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>
    const candidateKeys = [
      "data",
      "items",
      "list",
      "records",
      "rows",
      "result",
      "content",
    ]
    for (const k of candidateKeys) {
      const val = obj[k]
      if (Array.isArray(val)) return val as MenuItem[]
    }
    const values = Object.values(obj)
    if (
      values.length > 0 &&
      values.every(
        (v) =>
          v &&
          typeof v === "object" &&
          "id" in (v as never) &&
          "pid" in (v as never)
      )
    ) {
      return values as MenuItem[]
    }
  }
  console.warn(
    `[buildMenuTree] Unrecognized input type: ${Object.prototype.toString.call(
      input
    )}`
  )
  return []
}

/**
 * 将菜单转为树，健壮版本：输入类型宽松，内部做归一化，渲染期不会抛错。
 * 根节点规则：pid 找不到对应 id（或无效/空）即视为根。
 * 排序：同级先按 sort 升序，再按 name（中文友好）排序。
 * 性能：单次循环构建节点映射，单次循环建立父子关系，最后递归排序，整体 O(n log n)。
 */
export function buildMenuTree(input: unknown): MenuTreeNode[] {
  const items = normalizeMenuInput(input)
  if (items.length === 0) return []

  const nodeMap = new Map<string, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  for (const it of items) {
    nodeMap.set(it.id, { ...(it as MenuItem), children: [] })
  }

  for (const it of items) {
    const node = nodeMap.get(it.id)!
    const parent = nodeMap.get(it.pid)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (arr: MenuTreeNode[]) => {
    arr.sort((a, b) => {
      const sortDiff = (a.sort ?? 0) - (b.sort ?? 0)
      if (sortDiff !== 0) return sortDiff
      return a.name.localeCompare(b.name, "zh-Hans")
    })
    arr.forEach((n) => sortNodes(n.children))
  }

  sortNodes(roots)
  return roots
}
