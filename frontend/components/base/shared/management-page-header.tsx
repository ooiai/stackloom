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
        "overflow-hidden rounded-[1.75rem] border border-border/70 bg-[radial-gradient(circle_at_top_right,_color-mix(in_oklab,var(--primary)_10%,transparent),transparent_32%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white),color-mix(in_oklab,var(--background)_98%,black))] p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  )
}
