import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ManagementPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function ManagementPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: ManagementPageHeaderProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {children ? (
        <div className="border-t border-border/60 px-5 py-3">{children}</div>
      ) : null}
    </section>
  )
}
