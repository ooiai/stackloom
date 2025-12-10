"use client";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@stackloom/ui/components/alert-dialog";
import { LoaderCircle } from "lucide-react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface AlertDialogOptions {
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  autoCloseOnConfirm?: boolean;
  confirmLoading?: boolean;
  confirmDisable?: boolean;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => Promise<void> | void;
}

interface AlertDialogContextType {
  show: (options: AlertDialogOptions) => void;
  close?: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined,
);

export function AlertDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AlertDialogOptions>({});

  const show = useCallback((options: AlertDialogOptions) => {
    setOptions(options);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = async () => {
    try {
      await options.onConfirm?.();
    } finally {
      if (options.autoCloseOnConfirm) {
        setOpen(false);
      }
    }
  };

  const handleCancel = async () => {
    try {
      await options.onCancel?.();
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialogContext.Provider value={{ show, close }}>
      {children}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={options.confirmDisable || options.confirmLoading}
              onClick={handleConfirm}
              // onClick={(e) => {
              //   if (!options.autoCloseOnConfirm) {
              //     e.preventDefault();
              //     e.stopPropagation();
              //   }
              //   handleConfirm();
              // }}
            >
              {options.confirmLoading ? (
                <>
                  <LoaderCircle
                    className={cn("animate-[spin_0.6s_linear_infinite]")}
                  />
                  <span style={{ marginLeft: 8 }}>
                    {options.confirmText || "Continue"}
                  </span>
                </>
              ) : (
                options.confirmText || "Continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  );
}

export function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider",
    );
  }
  return context;
}
