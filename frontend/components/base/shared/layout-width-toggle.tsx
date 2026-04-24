"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type LayoutWidthMode = "contained" | "full"

interface LayoutWidthToggleProps {
  mode: LayoutWidthMode
  onModeChange: (mode: LayoutWidthMode) => void
}

function LayoutGlyph({
  mode,
  active,
}: {
  mode: LayoutWidthMode
  active: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-4 w-4 items-center justify-center rounded-[5px] border transition-colors",
        active
          ? "border-current/40 bg-current/10"
          : "border-muted-foreground/40 bg-transparent"
      )}
    >
      <span
        className={cn(
          "block h-2 rounded-[3px] transition-all",
          active ? "bg-current/90" : "bg-muted-foreground/70",
          mode === "contained" ? "w-2" : "w-3"
        )}
      />
    </span>
  )
}

export function LayoutWidthToggle({
  mode,
  onModeChange,
}: LayoutWidthToggleProps) {
  const options: Array<{ value: LayoutWidthMode; label: string }> = [
    { value: "contained", label: "居中" },
    { value: "full", label: "铺满" },
  ]

  return (
    <div
      className="hidden items-center rounded-xl border border-border/70 bg-background/90 p-1 sm:flex"
      aria-label="切换布局宽度"
      role="group"
    >
      {options.map((option) => {
        const active = option.value === mode

        return (
          <Button
            key={option.value}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-7 rounded-lg px-2 text-xs",
              !active && "text-muted-foreground"
            )}
            aria-pressed={active}
            onClick={() => onModeChange(option.value)}
          >
            <LayoutGlyph mode={option.value} active={active} />
            <span className="hidden lg:inline">{option.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
