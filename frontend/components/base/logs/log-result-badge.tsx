import { Badge } from "@/components/reui/badge"
import type { BadgeProps } from "@/components/reui/badge"

interface LogResultBadgeProps {
  label: string
  variant: BadgeProps["variant"]
}

export function LogResultBadge({ label, variant }: LogResultBadgeProps) {
  return (
    <Badge variant={variant} size="sm" radius="full">
      {label}
    </Badge>
  )
}
