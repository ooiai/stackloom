import type { MenuItem } from "@/lib/tree"

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
]
