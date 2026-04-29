"use client"

interface DetailMetaItemProps {
  label: string
  value: string
}

export function DetailMetaItem({ label, value }: DetailMetaItemProps) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  )
}
