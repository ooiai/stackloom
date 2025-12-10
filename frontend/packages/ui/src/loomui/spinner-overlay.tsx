"use client";
import { cn } from "@stackloom/ui/lib/utils";
import React from "react";
import { Spinner } from "./spinner";

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  blur?: boolean;
  delay?: number;
  loaderProps?: React.ComponentProps<typeof Spinner> & {
    children?: React.ReactNode;
  };
  size?: number;
  variant?:
    | "default"
    | "circle"
    | "pinwheel"
    | "circle-filled"
    | "ellipsis"
    | "ring"
    | "bars"
    | "infinite";
}

const SpinnerOverlay = ({
  variant = "circle",
  visible = false,
  size = 24,
  blur = true,
  delay = 0,
  loaderProps,
  className,
  ...props
}: LoadingOverlayProps) => {
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (visible) {
      timeoutId = setTimeout(() => {
        setShouldShow(true);
      }, delay);
    } else {
      setShouldShow(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [visible, delay]);

  if (!visible || !shouldShow) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "flex flex-col items-center justify-center gap-2",
        "bg-background/50",
        blur && "backdrop-blur-sm",
        "animate-in fade-in duration-200",
        className,
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
  );
};

export { SpinnerOverlay };
