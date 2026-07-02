"use client"

import { useCallback, useState } from "react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { toast } from "sonner"
import { useI18n } from "@/providers/i18n-provider"
import {
  generateRandomKey,
  generateSignature,
  encodeBase64,
  encodeBase64Double,
  decodeBase64Double,
  decodeBase64,
} from "../helpers"

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const
type HttpMethod = (typeof HTTP_METHODS)[number]

export interface SignatureParams {
  secretKey: string
  method: HttpMethod
  uri: string
  body: string
  params: Record<string, string>
}

export interface BasicAuthResult {
  input: string
  base64: string
  base64Double: string
}

export interface DecodeResult {
  encoded: string
  decoded: string
}

export function useSignKeysController() {
  const { t } = useI18n()

  const { copied: keyCopied, copy: copyKey } = useCopyToClipboard({
    onCopy: () => toast.success(t("sign-keys.toast.copied")),
  })
  const { copied: sigCopied, copy: copySig } = useCopyToClipboard({
    onCopy: () => toast.success(t("sign-keys.toast.copied")),
  })
  const { copied: b64Copied, copy: copyB64 } = useCopyToClipboard({
    onCopy: () => toast.success(t("sign-keys.toast.copied")),
  })
  const { copied: b64dCopied, copy: copyB64d } = useCopyToClipboard({
    onCopy: () => toast.success(t("sign-keys.toast.copied")),
  })

  const [secretKey, setSecretKey] = useState("")
  const [method, setMethod] = useState<HttpMethod>("POST")
  const [uri, setUri] = useState("")
  const [body, setBody] = useState("")
  const [paramsInput, setParamsInput] = useState("")
  const [signature, setSignature] = useState("")

  const [basicInput, setBasicInput] = useState("")
  const [basicResult, setBasicResult] = useState<BasicAuthResult | null>(null)

  const [decodeInput, setDecodeInput] = useState("")
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null)

  const onGenerateSecretKey = useCallback(() => {
    setSecretKey(generateRandomKey())
  }, [])

  const onGenerateSignature = useCallback(() => {
    const trimmedKey = secretKey.trim()
    const trimmedUri = uri.trim()
    const trimmedBody = body.trim()
    if (!trimmedKey) {
      toast.error(t("sign-keys.toast.secretKeyRequired"))
      return
    }
    if (!trimmedUri) {
      toast.error(t("sign-keys.toast.uriRequired"))
      return
    }

    const timestamp = Math.floor(Date.now() / 1000)
    let parsedBody = trimmedBody
    if (trimmedBody) {
      try {
        JSON.parse(trimmedBody)
      } catch {
        toast.error(t("sign-keys.toast.invalidJsonBody"))
        return
      }
    }

    let parsedParams: Record<string, string> = {}
    if (paramsInput.trim()) {
      try {
        const obj = JSON.parse(paramsInput.trim())
        parsedParams = Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, String(v)])
        )
      } catch {
        toast.error(t("sign-keys.toast.invalidJsonParams"))
        return
      }
    }

    const sig = generateSignature(
      timestamp,
      method,
      trimmedUri,
      parsedBody,
      parsedParams,
      trimmedKey
    )
    setSignature(sig)
  }, [secretKey, method, uri, body, paramsInput, t])

  const onGenerateBasicAuth = useCallback(() => {
    const trimmed = basicInput.trim()
    if (!trimmed) {
      toast.error(t("sign-keys.toast.basicInputRequired"))
      return
    }
    setBasicResult({
      input: trimmed,
      base64: encodeBase64(trimmed),
      base64Double: encodeBase64Double(trimmed),
    })
  }, [basicInput, t])

  const onDecodeBasicAuth = useCallback(() => {
    const trimmed = decodeInput.trim()
    if (!trimmed) {
      toast.error(t("sign-keys.toast.decodeInputRequired"))
      return
    }
    let decoded = ""
    let error = false
    try {
      try {
        decoded = decodeBase64Double(trimmed)
      } catch {
        try {
          decoded = decodeBase64(trimmed)
        } catch {
          error = true
        }
      }
    } catch {
      error = true
    }
    if (error || !decoded) {
      toast.error(t("sign-keys.toast.decodeFailed"))
      return
    }
    setDecodeResult({ encoded: trimmed, decoded })
  }, [decodeInput, t])

  return {
    view: {
      secretKey,
      setSecretKey,
      method,
      setMethod,
      uri,
      setUri,
      body,
      setBody,
      paramsInput,
      setParamsInput,
      signature,
      basicInput,
      setBasicInput,
      basicResult,
      decodeInput,
      setDecodeInput,
      decodeResult,
      keyCopied,
      sigCopied,
      b64Copied,
      b64dCopied,
      copyKey,
      copySig,
      copyB64,
      copyB64d,
      onGenerateSecretKey,
      onGenerateSignature,
      onGenerateBasicAuth,
      onDecodeBasicAuth,
    },
  }
}
