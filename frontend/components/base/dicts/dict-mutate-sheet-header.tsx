"use client"

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function DictMutateSheetHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <SheetHeader className="border-b border-border/60 px-5 py-4">
      <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </SheetTitle>
      <SheetDescription className="max-w-2xl text-sm leading-6 text-muted-foreground/80">
        {description}
      </SheetDescription>
    </SheetHeader>
  )
}
