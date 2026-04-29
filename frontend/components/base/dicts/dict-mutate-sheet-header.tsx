"use client"

import { EntityMutateSheetHeader } from "@/components/base/shared/entity-mutate-sheet-header"

export function DictMutateSheetHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <EntityMutateSheetHeader title={title} description={description} />
}
