"use client"

import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"

interface TenantMutateSheetHeaderProps {
  title: string
  description: string
}

export function TenantMutateSheetHeader({
  title,
  description,
}: TenantMutateSheetHeaderProps) {
  return (
    <EntityMutateSheetHeader title={title} description={description} />
  )
}
