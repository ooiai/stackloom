"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useQuery } from "@tanstack/react-query"
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  Link2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { memberApi } from "@/stores/web-api"

interface MembersInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MembersInviteDialog({
  open,
  onOpenChange,
}: MembersInviteDialogProps) {
  const { t } = useI18n()
  const { copied, copy } = useCopyToClipboard({ timeout: 5000 })

  const { data, isFetching } = useQuery({
    queryKey: ["members", "invite-code"],
    queryFn: () => memberApi.getInviteCode(),
    enabled: open,
    staleTime: 1000 * 60 * 5,
  })

  const inviteLink =
    data?.invite_code && typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${data.invite_code}`
      : ""

  const handleCopy = () => copy(inviteLink)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/70 bg-background shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <UsersIcon className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">
                  {t("members.invite.title")}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t("members.invite.description")}
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              render={
                <button className="mt-0.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
              }
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("members.invite.linkLabel")}
              </label>
              {isFetching ? (
                <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                  <Spinner className="size-3.5" />
                  <span>{t("members.invite.loading")}</span>
                </div>
              ) : (
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Link2Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <Input
                    readOnly
                    value={inviteLink}
                    className="pr-10 pl-8 font-mono text-xs"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!inviteLink}
                    className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground/80 transition-colors hover:text-foreground disabled:pointer-events-none"
                    aria-label={
                      copied
                        ? t("members.invite.copied")
                        : t("members.invite.copyLink")
                    }
                  >
                    <div className="relative size-4">
                      <CheckIcon
                        className={cn(
                          "absolute inset-0 size-4 text-primary transition-[transform,opacity] duration-200",
                          copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                      />
                      <CopyIcon
                        className={cn(
                          "absolute inset-0 size-4 transition-[transform,opacity] duration-200",
                          copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                        )}
                      />
                    </div>
                  </button>
                </div>
              )}
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleCopy}
              disabled={isFetching || !inviteLink}
            >
              <div className="relative size-4">
                <CheckIcon
                  className={cn(
                    "absolute inset-0 size-4 transition-[transform,opacity] duration-200",
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  )}
                />
                <CopyIcon
                  className={cn(
                    "absolute inset-0 size-4 transition-[transform,opacity] duration-200",
                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  )}
                />
              </div>
              {copied
                ? t("members.invite.copied")
                : t("members.invite.copyLink")}
            </Button>

            {/* Expiry hint */}
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <ClockIcon className="size-3.5 shrink-0" />
              <span>{t("members.invite.expiry")}</span>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
