interface MonitorSectionGroupProps {
  title: string
  children: React.ReactNode
}

export function MonitorSectionGroup({ title, children }: MonitorSectionGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">{title}</h3>
        <div className="flex-1 border-t border-border" />
      </div>
      {children}
    </div>
  )
}
