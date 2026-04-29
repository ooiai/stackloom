"use client"

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface EntityMutateSheetHeaderProps {
  title: string
  description: string
}

export function EntityMutateSheetHeader({
  title,
  description,
}: EntityMutateSheetHeaderProps) {
  return (
    <SheetHeader className="px-5 py-4">
      <SheetTitle className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </SheetTitle>
      <SheetDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </SheetDescription>
    </SheetHeader>
  )
}
