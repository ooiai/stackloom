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
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl border border-border/70 bg-muted/40">
        <DatabaseSearchIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
