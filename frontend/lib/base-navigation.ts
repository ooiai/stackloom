import { buildMenuTree, type MenuItem, type MenuTreeNode } from "@/lib/tree"
import type { MenuTreeNodeData } from "@/types/base.types"

export const BASE_CURRENT_MENU_ITEMS: MenuItem[] = [
  {
    id: "base-root",
    pid: "0",
    name: "后台管理",
    code: "base-root",
    icon: "LayoutGrid",
    path: "/",
    sort: 0,
    visible: 1,
    remark: "Stackloom 管理后台入口",
  },
  {
    id: "upms-group",
    pid: "base-root",
    name: "账号与权限",
    code: "upms",
    icon: "ShieldCheck",
    path: "/upms",
    sort: 1,
    visible: 1,
    remark: "用户、角色、租户与权限模块",
  },
  {
    id: "tools-group",
    pid: "base-root",
    name: "系统工具",
    code: "tools",
    icon: "BookMarked",
    path: "/tools",
    sort: 2,
    visible: 1,
    remark: "配置业务基础能力和通用字典",
  },
  {
    id: "upms-users",
    pid: "upms-group",
    name: "用户管理",
    code: "upms-users",
    icon: "Users",
    path: "/upms/users",
    sort: 1,
    visible: 1,
    remark: "维护系统用户资料、账号状态与联系方式",
  },
  {
    id: "upms-tenants",
    pid: "upms-group",
    name: "租户管理",
    code: "upms-tenants",
    icon: "Building2",
    path: "/upms/tenants",
    sort: 2,
    visible: 1,
    remark: "维护学校、校区与部门等层级租户结构",
  },
  {
    id: "upms-menus",
    pid: "upms-group",
    name: "菜单管理",
    code: "upms-menus",
    icon: "Waypoints",
    path: "/upms/menus",
    sort: 3,
    visible: 1,
    remark: "维护导航菜单、路由配置与层级结构",
  },
  {
    id: "upms-roles",
    pid: "upms-group",
    name: "角色管理",
    code: "upms-roles",
    icon: "Folders",
    path: "/upms/roles",
    sort: 4,
    visible: 1,
    remark: "维护角色树、角色描述与层级结构",
  },
  {
    id: "upms-perms",
    pid: "upms-group",
    name: "权限管理",
    code: "upms-perms",
    icon: "KeyRound",
    path: "/upms/perms",
    sort: 5,
    visible: 1,
    remark: "维护权限树、资源动作与层级结构",
  },
  {
    id: "tools-dicts",
    pid: "tools-group",
    name: "字典管理",
    code: "tools-dicts",
    icon: "BookMarked",
    path: "/tools/dicts",
    sort: 1,
    visible: 1,
    remark: "维护树形字典项、键值和扩展配置",
  },
  {
    id: "tools-system-logs",
    pid: "tools-group",
    name: "系统日志",
    code: "tools-system-logs",
    icon: "Activity",
    path: "/tools/system-logs",
    sort: 2,
    visible: 1,
    remark: "查看请求链路、状态码与耗时摘要",
  },
  {
    id: "tools-audit-logs",
    pid: "tools-group",
    name: "审计日志",
    code: "tools-audit-logs",
    icon: "ShieldAlert",
    path: "/tools/audit-logs",
    sort: 3,
    visible: 1,
    remark: "查询敏感操作与安全审计留痕",
  },
  {
    id: "tools-operation-logs",
    pid: "tools-group",
    name: "操作日志",
    code: "tools-operation-logs",
    icon: "ClipboardList",
    path: "/tools/operation-logs",
    sort: 4,
    visible: 1,
    remark: "追踪后台业务操作与变更快照",
  },
  {
    id: "tools-notifications",
    pid: "tools-group",
    name: "通知中心",
    code: "tools-notifications",
    icon: "Bell",
    path: "/tools/notifications",
    sort: 5,
    visible: 1,
    remark: "管理手动通知、事件模板和自动规则",
  },
  {
    id: "tools-storage",
    pid: "tools-group",
    name: "对象存储",
    code: "tools-storage",
    icon: "Database",
    path: "/tools/storage",
    sort: 6,
    visible: 1,
    remark: "浏览对象存储文件、前缀和访问地址",
  },
]

const TOOLS_MENU_CODE = "tools"
const TOOLS_STORAGE_MENU_CODE = "tools-storage"
const TOOLS_NOTIFICATIONS_MENU_CODE = "tools-notifications"

function compareMenuNodes(a: MenuTreeNodeData, b: MenuTreeNodeData) {
  const sortDiff = a.sort - b.sort
  if (sortDiff !== 0) {
    return sortDiff
  }

  return a.name.localeCompare(b.name, "zh-Hans")
}

function toMenuTreeNodeData(node: MenuTreeNode): MenuTreeNodeData {
  return {
    id: node.id,
    tenant_id: null,
    parent_id: node.pid === "0" ? null : node.pid,
    code: node.code,
    name: node.name,
    description: node.remark,
    path: node.path || null,
    component: null,
    redirect: null,
    icon: node.icon || null,
    menu_type: node.children.length > 0 ? 1 : 2,
    sort: node.sort,
    visible: node.visible === 1,
    keep_alive: false,
    status: 1,
    created_at: "",
    updated_at: "",
    children: node.children.map(toMenuTreeNodeData),
  }
}

function cloneMenuNode(node: MenuTreeNodeData): MenuTreeNodeData {
  return {
    ...node,
    children: node.children.map(cloneMenuNode),
  }
}

function hasMenuCode(nodes: MenuTreeNodeData[], code: string): boolean {
  return nodes.some((node) => node.code === code || hasMenuCode(node.children, code))
}

function findMenuNode(
  nodes: MenuTreeNodeData[],
  code: string
): MenuTreeNodeData | null {
  for (const node of nodes) {
    if (node.code === code) {
      return node
    }

    const childMatch = findMenuNode(node.children, code)
    if (childMatch) {
      return childMatch
    }
  }

  return null
}

function appendMissingChildMenu(
  nodes: MenuTreeNodeData[],
  parentCode: string,
  child: MenuTreeNodeData
): MenuTreeNodeData[] {
  let changed = false

  const nextNodes = nodes.map((node) => {
    const nextChildren = appendMissingChildMenu(node.children, parentCode, child)
    let mergedChildren = nextChildren

    if (node.code === parentCode && !nextChildren.some((item) => item.code === child.code)) {
      mergedChildren = [...nextChildren, cloneMenuNode(child)].sort(compareMenuNodes)
    }

    if (mergedChildren !== node.children) {
      changed = true
      return {
        ...node,
        children: mergedChildren,
      }
    }

    return node
  })

  return changed ? nextNodes : nodes
}

const BASE_CURRENT_MENU_TREE = buildMenuTree(BASE_CURRENT_MENU_ITEMS).map(
  toMenuTreeNodeData
)
const BASE_STORAGE_MENU = findMenuNode(BASE_CURRENT_MENU_TREE, TOOLS_STORAGE_MENU_CODE)
const BASE_NOTIFICATIONS_MENU = findMenuNode(
  BASE_CURRENT_MENU_TREE,
  TOOLS_NOTIFICATIONS_MENU_CODE
)

export function mergeBaseCurrentMenus(
  nodes: MenuTreeNodeData[],
  menuCodes: string[]
): MenuTreeNodeData[] {
  if (!menuCodes.includes(TOOLS_MENU_CODE)) {
    return nodes
  }

  let nextNodes = nodes

  if (BASE_NOTIFICATIONS_MENU && !hasMenuCode(nextNodes, TOOLS_NOTIFICATIONS_MENU_CODE)) {
    nextNodes = appendMissingChildMenu(
      nextNodes,
      TOOLS_MENU_CODE,
      BASE_NOTIFICATIONS_MENU
    )
  }

  if (BASE_STORAGE_MENU && !hasMenuCode(nextNodes, TOOLS_STORAGE_MENU_CODE)) {
    nextNodes = appendMissingChildMenu(nextNodes, TOOLS_MENU_CODE, BASE_STORAGE_MENU)
  }

  return nextNodes
}
