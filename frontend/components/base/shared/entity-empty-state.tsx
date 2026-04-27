import { DatabaseSearchIcon } from "lucide-react"

interface EntityEmptyStateProps {
  title: string
  description: string
}

export function EntityEmptyState({
  title,
  description,
}: EntityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
        <DatabaseSearchIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
