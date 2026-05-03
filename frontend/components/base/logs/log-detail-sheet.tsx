"use client"

import type { ReactNode } from "react"

import { formatLogJson } from "@/components/base/logs/helpers"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface LogDetailField {
  label: string
  value: ReactNode
}

interface LogJsonSection {
  title: string
  value: unknown
}

interface LogDetailSheetProps {
  open: boolean
  title: string
  description: string
  fields: LogDetailField[]
  jsonSections?: LogJsonSection[]
  onOpenChange: (open: boolean) => void
}

export function LogDetailSheet({
  open,
  title,
  description,
  fields,
  jsonSections = [],
  onOpenChange,
}: LogDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
          <SheetDescription className="max-w-2xl text-sm leading-6">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-5 py-5">
          <section className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.label}
                className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3"
              >
                <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {field.label}
                </p>
                <div className="break-all text-sm leading-6 text-foreground">
                  {field.value}
                </div>
              </div>
            ))}
          </section>

          {jsonSections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/20 p-4 text-xs leading-6 text-foreground">
                {formatLogJson(section.value)}
              </pre>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
