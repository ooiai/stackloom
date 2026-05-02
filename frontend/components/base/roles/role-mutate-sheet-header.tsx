"use client"

import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"

interface RoleMutateSheetHeaderProps {
  title: string
  description: string
}

export function RoleMutateSheetHeader({
  title,
  description,
}: RoleMutateSheetHeaderProps) {
  return (
    <EntityMutateSheetHeader title={title} description={description} />
  )
}
