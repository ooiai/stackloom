import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EntityNameCellProps {
  avatarAlt: string
  avatarFallback: string
  avatarSrc?: string
  description: string
  title: string
}

export function EntityNameCell({
  avatarAlt,
  avatarFallback,
  avatarSrc,
  description,
  title,
}: EntityNameCellProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback className="font-medium">
          {avatarFallback}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-px">
        <div className="truncate font-medium text-foreground">{title}</div>
        <div className="max-w-44 truncate text-xs text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  )
}
