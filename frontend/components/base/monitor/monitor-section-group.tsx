interface MonitorSectionGroupProps {
  title: string
  description?: string
  summary?: React.ReactNode
  children: React.ReactNode
}

export function MonitorSectionGroup({
  title,
  description,
  summary,
  children,
}: MonitorSectionGroupProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">{title}</h3>
          {description ? (
            <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {summary ? (
          <div className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
            {summary}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  )
}
