"use client"
import React from "react"
import { Spinner } from "./spinner"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean
  blur?: boolean
  delay?: number
  // 是否固定在屏幕上，默认为 true。如果为 false，则为 absolute 定位
  fixed?: boolean
  loaderProps?: React.ComponentProps<typeof Spinner> & {
    children?: React.ReactNode
  }
  size?: number
  variant?:
    | "default"
    | "circle"
    | "pinwheel"
    | "circle-filled"
    | "ellipsis"
    | "ring"
    | "bars"
    | "infinite"
}

const SpinnerOverlay = ({
  variant = "circle",
  visible = false,
  size = 24,
  blur = true,
  delay = 0,
  fixed = true,
  loaderProps,
  className,
  ...props
}: LoadingOverlayProps) => {
  const [shouldShow, setShouldShow] = React.useState(false)

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (!visible) {
      timeoutId = setTimeout(() => {
        setShouldShow(false)
      }, 0)
    } else {
      timeoutId = setTimeout(() => {
        setShouldShow(true)
      }, delay)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [visible, delay])

  if (!visible || !shouldShow) return null

  return (
    <div
      className={cn(
        fixed ? "fixed inset-0 z-50" : "absolute inset-0 z-10",
        "flex flex-col items-center justify-center gap-2",
        "bg-background/50",
        blur && "backdrop-blur-sm",
        "animate-in duration-200 fade-in",
        className
      )}
      {...props}
    >
      <Spinner size={size} variant={variant} className="text-primary" />
      {loaderProps?.children && (
        <div className="text-sm text-muted-foreground">
          {loaderProps.children}
        </div>
      )}
    </div>
  )
}

export { SpinnerOverlay }
