"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type BarListItem<T = unknown> = T & {
  key?: string
  href?: string
  value: number
  name: string
  meta?: string
}

export interface BarListProps<T = unknown>
  extends React.HTMLAttributes<HTMLDivElement> {
  data: BarListItem<T>[]
  valueFormatter?: (value: number) => string
  showAnimation?: boolean
  onValueChange?: (payload: BarListItem<T>) => void
  sortOrder?: "ascending" | "descending" | "none"
}

function BarListInner<T>(
  {
    data = [],
    valueFormatter = (value) => value.toString(),
    showAnimation = false,
    onValueChange,
    sortOrder = "descending",
    className,
    ...props
  }: BarListProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const sortedData = React.useMemo(() => {
    if (sortOrder === "none") {
      return data
    }

    return [...data].sort((a, b) =>
      sortOrder === "ascending" ? a.value - b.value : b.value - a.value
    )
  }, [data, sortOrder])

  const widths = React.useMemo(() => {
    const maxValue = Math.max(...sortedData.map((item) => item.value), 0)
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2)
    )
  }, [sortedData])

  const handleValueChange = React.useCallback(
    (item: BarListItem<T>) => {
      onValueChange?.(item)
    },
    [onValueChange]
  )

  return (
    <div
      ref={forwardedRef}
      data-slot="bar-list"
      aria-sort={sortOrder}
      className={cn("flex items-start justify-between gap-6", className)}
      {...props}
    >
      <div className="relative w-full space-y-2">
        {sortedData.map((item, index) => {
          const isInteractive = Boolean(onValueChange)
          const label = item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="truncate whitespace-nowrap rounded-sm text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {item.name}
            </a>
          ) : (
            <span className="truncate whitespace-nowrap text-sm font-medium text-foreground">
              {item.name}
            </span>
          )

          return (
            <div
              key={item.key ?? item.name}
              role={isInteractive ? "button" : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              onClick={isInteractive ? () => handleValueChange(item) : undefined}
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        handleValueChange(item)
                      }
                    }
                  : undefined
              }
              className={cn(
                "group relative overflow-hidden rounded-lg outline-none transition-colors",
                isInteractive &&
                  "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <div className="absolute inset-y-0 left-0 right-0 rounded-lg bg-muted/45" />
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-lg bg-primary/12 transition-[width,background-color] duration-300 ease-out",
                  isInteractive && "group-hover:bg-primary/16",
                  showAnimation && "duration-700"
                )}
                style={{ width: `${widths[index]}%` }}
              />
              <div className="relative flex min-h-9 items-center px-3 py-2">
                <div className="min-w-0 pr-3">
                  {label}
                  {item.meta ? (
                    <div className="truncate text-xs text-muted-foreground">{item.meta}</div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 space-y-2">
        {sortedData.map((item) => (
          <div
            key={item.key ?? item.name}
            className="flex min-h-9 items-center justify-end text-right"
          >
            <div>
              <span className="truncate whitespace-nowrap text-sm font-medium text-foreground">
                {valueFormatter(item.value)}
              </span>
              {item.meta ? <div className="text-xs text-muted-foreground">{item.meta}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

BarListInner.displayName = "BarList"

const BarList = React.forwardRef(BarListInner) as <T>(
  props: BarListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReturnType<typeof BarListInner>

export { BarList }
