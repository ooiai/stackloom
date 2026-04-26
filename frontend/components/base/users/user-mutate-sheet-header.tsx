"use client"

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function UserMutateSheetHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <SheetHeader className="border-b border-border/60 pb-5">
      <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </SheetTitle>
      <SheetDescription className="max-w-xl text-sm leading-6 text-muted-foreground/70">
        {description}
      </SheetDescription>
    </SheetHeader>
  )
}
