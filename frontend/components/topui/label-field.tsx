"use client"

import type { ReactNode } from "react"
import { LucideCircleQuestionMark } from "lucide-react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LabelFieldTooltip {
  content: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  iconClassName?: string
  contentClassName?: string
}

interface LabelFieldProps {
  label: ReactNode
  htmlFor?: string
  error?: ReactNode
  description?: ReactNode
  tooltip?: LabelFieldTooltip
  className?: string
  labelClassName?: string
  contentClassName?: string
  invalid?: boolean
  children: ReactNode
}

export function LabelField({
  label,
  htmlFor,
  error,
  description,
  tooltip,
  className,
  labelClassName,
  contentClassName,
  invalid,
  children,
}: LabelFieldProps) {
  return (
    <Field className={className} data-invalid={invalid}>
      <FieldLabel
        className={cn(
          "gap-1.5 text-[13px] leading-5 font-semibold text-foreground/80",
          labelClassName
        )}
        htmlFor={htmlFor}
      >
        <span>{label}</span>
        {tooltip?.content ? (
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                tabIndex={-1}
                aria-label="查看字段说明"
                className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <LucideCircleQuestionMark
                  className={cn("size-3", tooltip.iconClassName)}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side={tooltip.side}
              align={tooltip.align}
              className={tooltip.contentClassName}
            >
              {tooltip.content}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </FieldLabel>

      <FieldContent className={cn("gap-2", contentClassName)}>
        {children}
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  )
}

export type { LabelFieldProps, LabelFieldTooltip }
