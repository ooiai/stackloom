import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function WebHomePage() {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Stackloom
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          管理后台与业务入口
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          当前根路由已恢复，避免 Turbopack 在开发态写入 `/page` 入口时崩溃。
          后续如果有正式官网内容，可以直接替换这个页面。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/upms/users" className={buttonVariants()}>
          进入用户管理
        </Link>
      </div>
    </main>
  )
}
