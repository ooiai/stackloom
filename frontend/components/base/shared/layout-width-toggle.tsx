"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { GalleryHorizontalIcon } from "lucide-react"

export type LayoutWidthMode = "contained" | "full"

interface LayoutWidthToggleProps {
  mode: LayoutWidthMode
  onModeChange: (mode: LayoutWidthMode) => void
}

export function LayoutWidthToggle({
  mode,
  onModeChange,
}: LayoutWidthToggleProps) {
  const { t } = useI18n()
  const isFull = mode === "full"
  const nextMode: LayoutWidthMode = isFull ? "contained" : "full"
  const nextLabel = isFull
    ? t("common.layout.switchToContained")
    : t("common.layout.switchToFull")

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "hidden md:inline-flex",
        isFull && "bg-accent text-foreground hover:bg-accent"
      )}
      aria-pressed={isFull}
      aria-label={nextLabel}
      title={nextLabel}
      onClick={() => onModeChange(nextMode)}
    >
      <GalleryHorizontalIcon className="size-4" />
      <span className="sr-only">{nextLabel}</span>
    </Button>
  )
}
