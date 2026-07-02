import CryptoJS from "crypto-js"

export function generateRandomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function generateSignature(
  timestamp: number,
  method: string,
  uri: string,
  body: string,
  params: Record<string, string>,
  secretKey: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&")
  const data = `${timestamp}${method}${uri}${body}${sortedParams}`
  return CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Hex)
}

export function encodeBase64(str: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
}

export function encodeBase64Double(str: string): string {
  const first = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(first))
}

export function decodeBase64Double(encoded: string): string {
  const first = CryptoJS.enc.Base64.parse(encoded).toString(CryptoJS.enc.Utf8)
  return CryptoJS.enc.Base64.parse(first).toString(CryptoJS.enc.Utf8)
}

export function decodeBase64(encoded: string): string {
  return CryptoJS.enc.Base64.parse(encoded).toString(CryptoJS.enc.Utf8)
}
