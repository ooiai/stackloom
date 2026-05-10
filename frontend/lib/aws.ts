import type { AwsS3Token } from "@/hooks/use-aws-s3"
import type { AwsStsResp } from "@/types/system.types"

type UploadAwsObjectParams = {
  file: File
  folder: string
  uploadFile: (
    file: File,
    pathPrefix: string,
    token: AwsS3Token
  ) => Promise<{ path: string }>
  getSts: () => Promise<AwsStsResp>
}

const pick = (...values: Array<string | undefined>) =>
  values.find((value) => typeof value === "string" && value.length > 0) ?? ""

/**
 * Normalize endpoint for safe URL construction
 * - Trims whitespace and trailing slashes
 * - Auto-detects missing protocol and prepends https:// if needed
 * - Supports formats: "host", "host/path", "http(s)://..."
 */
function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/$/, "")
  
  // Check if protocol is already present
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed
  }
  
  // Prepend https:// if missing
  return `https://${trimmed}`
}

export function mapStsToAwsS3Token(sts: AwsStsResp): AwsS3Token {
  return {
    region: pick(sts.region),
    endpoint: normalizeEndpoint(pick(sts.endpoint)),
    accessKeyId: pick(sts.access_key_id, sts.accessKeyId),
    accessKeySecret: pick(sts.access_key_secret, sts.accessKeySecret),
    bucket: pick(sts.bucket),
    sessionToken: pick(sts.security_token, sts.securityToken),
    credentialScope: sts.credential_scope ?? sts.credentialScope,
    accountId: sts.account_id ?? sts.accountId,
    forcePathStyle: sts.force_path_style ?? sts.forcePathStyle ?? true,
  }
}

export function buildAwsObjectUrl(token: AwsS3Token, path: string) {
  const normalizedEndpoint = normalizeEndpoint(token.endpoint)
  const normalizedBucket = token.bucket.trim()
  const normalizedPath = path.replace(/^\//, "")

  if (token.forcePathStyle) {
    return `${normalizedEndpoint}/${normalizedBucket}/${normalizedPath}`
  }

  try {
    const endpointUrl = new URL(normalizedEndpoint)
    return `${endpointUrl.protocol}//${normalizedBucket}.${endpointUrl.host}/${normalizedPath}`
  } catch {
    throw new Error(
      `Invalid endpoint URL: ${normalizedEndpoint}. ` +
      `Endpoint must be a valid domain or URL. Got: ${token.endpoint}`
    )
  }
}

export async function uploadAwsObject({
  file,
  folder,
  uploadFile,
  getSts,
}: UploadAwsObjectParams) {
  const sts = await getSts()
  const token = mapStsToAwsS3Token(sts)
  const result = await uploadFile(file, folder, token)

  return buildAwsObjectUrl(token, result.path)
}
