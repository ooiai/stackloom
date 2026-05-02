"use client"

import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"

interface PermMutateSheetHeaderProps {
  title: string
  description: string
}

export function PermMutateSheetHeader({
  title,
  description,
}: PermMutateSheetHeaderProps) {
  return (
    <EntityMutateSheetHeader title={title} description={description} />
  )
}
