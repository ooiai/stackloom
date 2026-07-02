"use client"

import { CheckIcon, CopyIcon, KeyRoundIcon, ShieldCheckIcon, ArrowRightLeftIcon } from "lucide-react"

import { ManagementPageHeader } from "@/components/base/shared/management-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/reui/textarea"
import { useI18n } from "@/providers/i18n-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  SignatureParams,
  BasicAuthResult,
  DecodeResult,
} from "./hooks/use-sign-keys-controller"

export interface SignKeysPageViewProps {
  secretKey: string
  setSecretKey: (v: string) => void
  method: SignatureParams["method"]
  setMethod: (v: SignatureParams["method"]) => void
  uri: string
  setUri: (v: string) => void
  body: string
  setBody: (v: string) => void
  paramsInput: string
  setParamsInput: (v: string) => void
  signature: string
  basicInput: string
  setBasicInput: (v: string) => void
  basicResult: BasicAuthResult | null
  decodeInput: string
  setDecodeInput: (v: string) => void
  decodeResult: DecodeResult | null
  keyCopied: boolean
  sigCopied: boolean
  b64Copied: boolean
  b64dCopied: boolean
  copyKey: (v: string) => void
  copySig: (v: string) => void
  copyB64: (v: string) => void
  copyB64d: (v: string) => void
  onGenerateSecretKey: () => void
  onGenerateSignature: () => void
  onGenerateBasicAuth: () => void
  onDecodeBasicAuth: () => void
}

export function SignKeysPageView(props: SignKeysPageViewProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title={t("sign-keys.title")}
        description={t("sign-keys.description")}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
            <ShieldCheckIcon className="size-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {t("sign-keys.section.signature.title")}
            </h2>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("sign-keys.section.signature.secretKey")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("sign-keys.section.signature.secretKeyHint")}
              </p>
              <div className="flex gap-2">
                <Input
                  value={props.secretKey}
                  onChange={(e) => props.setSecretKey(e.target.value)}
                  placeholder={t("sign-keys.section.signature.secretKeyPlaceholder")}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={props.onGenerateSecretKey}
                  className="shrink-0"
                >
                  <KeyRoundIcon className="size-4" />
                  {t("sign-keys.actions.generate")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("sign-keys.section.signature.method")}
                </label>
                <Select
                  value={props.method}
                  onValueChange={(v) =>
                    props.setMethod(v as SignatureParams["method"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("sign-keys.section.signature.uri")}
                </label>
                <Input
                  value={props.uri}
                  onChange={(e) => props.setUri(e.target.value)}
                  placeholder="/apiv1/base/users/page"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("sign-keys.section.signature.body")}
              </label>
              <Textarea
                value={props.body}
                onChange={(
                  e: React.ChangeEvent<HTMLTextAreaElement>
                ) => props.setBody(e.target.value)}
                placeholder='{"keyword": "test"}'
                className="min-h-20 font-mono text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("sign-keys.section.signature.params")}
              </label>
              <Input
                value={props.paramsInput}
                onChange={(e) => props.setParamsInput(e.target.value)}
                placeholder='{"page": "1", "size": "10"}'
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={props.onGenerateSignature}
              className="w-full"
            >
              {t("sign-keys.actions.generateSignature")}
            </Button>

            {props.signature ? (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("sign-keys.section.signature.output")}
                  </span>
                  <Button
                    variant={props.sigCopied ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => props.copySig(props.signature)}
                    disabled={props.sigCopied}
                  >
                    {props.sigCopied ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                    {props.sigCopied
                      ? t("sign-keys.actions.copied")
                      : t("sign-keys.actions.copy")}
                  </Button>
                </div>
                <p className="break-all font-mono text-sm text-foreground">
                  {props.signature}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
              <KeyRoundIcon className="size-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                {t("sign-keys.section.basicAuth.title")}
              </h2>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("sign-keys.section.basicAuth.input")}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("sign-keys.section.basicAuth.inputHint")}
                </p>
                <Input
                  value={props.basicInput}
                  onChange={(e) => props.setBasicInput(e.target.value)}
                  placeholder="topedu::auth"
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={props.onGenerateBasicAuth} className="w-full">
                {t("sign-keys.actions.generateBasicAuth")}
              </Button>

              {props.basicResult ? (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t("sign-keys.section.basicAuth.singleBase64")}
                      </span>
                      <Button
                        variant={props.b64Copied ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => props.copyB64(props.basicResult!.base64)}
                        disabled={props.b64Copied}
                      >
                        {props.b64Copied ? (
                          <CheckIcon className="size-3.5" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                        {props.b64Copied
                          ? t("sign-keys.actions.copied")
                          : t("sign-keys.actions.copy")}
                      </Button>
                    </div>
                    <p className="break-all font-mono text-sm text-foreground">
                      {props.basicResult.base64}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t("sign-keys.section.basicAuth.doubleBase64")}
                      </span>
                      <Button
                        variant={props.b64dCopied ? "ghost" : "outline"}
                        size="sm"
                        onClick={() =>
                          props.copyB64d(props.basicResult!.base64Double)
                        }
                        disabled={props.b64dCopied}
                      >
                        {props.b64dCopied ? (
                          <CheckIcon className="size-3.5" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                        {props.b64dCopied
                          ? t("sign-keys.actions.copied")
                          : t("sign-keys.actions.copy")}
                      </Button>
                    </div>
                    <p className="break-all font-mono text-sm text-foreground">
                      {props.basicResult.base64Double}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("sign-keys.section.basicAuth.usageHint")}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
              <ArrowRightLeftIcon className="size-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                {t("sign-keys.section.decoder.title")}
              </h2>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("sign-keys.section.decoder.input")}
                </label>
                <Input
                  value={props.decodeInput}
                  onChange={(e) => props.setDecodeInput(e.target.value)}
                  placeholder={t("sign-keys.section.decoder.placeholder")}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={props.onDecodeBasicAuth} className="w-full" variant="outline">
                {t("sign-keys.actions.decode")}
              </Button>

              {props.decodeResult ? (
                <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("sign-keys.section.decoder.output")}
                  </span>
                  <p className="break-all font-mono text-sm text-foreground">
                    {props.decodeResult.decoded}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
