"use client"

import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"

interface MenuMutateSheetHeaderProps {
  title: string
  description: string
}

export function MenuMutateSheetHeader({
  title,
  description,
}: MenuMutateSheetHeaderProps) {
  return (
    <EntityMutateSheetHeader title={title} description={description} />
  )
}
