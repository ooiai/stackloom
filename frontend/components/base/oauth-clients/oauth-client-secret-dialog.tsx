"use client"

import { useState } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { CheckIcon, CopyIcon, KeyRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/providers/i18n-provider"

interface OAuthClientSecretDialogProps {
  open: boolean
  mode: "create" | "rotate"
  clientId?: string
  clientSecret: string
  onClose: () => void
}

function CopyableField({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string
  value: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs text-foreground">
          {value}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 gap-1 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckIcon className="size-3 text-success" />
              {copiedLabel}
            </>
          ) : (
            <>
              <CopyIcon className="size-3" />
              {copyLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export function OAuthClientSecretDialog({
  open,
  mode,
  clientId,
  clientSecret,
  onClose,
}: OAuthClientSecretDialogProps) {
  const { t } = useI18n()

  const title =
    mode === "create"
      ? t("oauth-clients.secretDialog.title")
      : t("oauth-clients.secretDialog.rotateTitle")
  const description =
    mode === "create"
      ? t("oauth-clients.secretDialog.description")
      : t("oauth-clients.secretDialog.rotateDescription")

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/70 bg-background p-6 shadow-2xl outline-none">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <KeyRoundIcon className="size-4 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-[13px] leading-5 text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="space-y-3">
            {mode === "create" && clientId ? (
              <CopyableField
                label={t("oauth-clients.secretDialog.clientIdLabel")}
                value={clientId}
                copyLabel={t("oauth-clients.secretDialog.copy")}
                copiedLabel={t("oauth-clients.secretDialog.copied")}
              />
            ) : null}

            <CopyableField
              label={t("oauth-clients.secretDialog.secretLabel")}
              value={clientSecret}
              copyLabel={t("oauth-clients.secretDialog.copy")}
              copiedLabel={t("oauth-clients.secretDialog.copied")}
            />
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={onClose}>
              {t("oauth-clients.secretDialog.close")}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
