import type { AwsS3Token, UploadFileOptions } from "@/hooks/use-aws-s3"
import type { AwsStsResp } from "@/types/system.types"

export const SINGLE_REQUEST_UPLOAD_PART_SIZE_BYTES = 100 * 1024 * 1024

type UploadAwsObjectParams = {
  file: File
  folder: string
  uploadFile: (
    file: File,
    pathPrefix: string,
    token: AwsS3Token,
    options?: UploadFileOptions
  ) => Promise<{ path: string }>
  getSts: () => Promise<AwsStsResp>
  uploadOptions?: UploadFileOptions
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

function resolveForcePathStyle(sts: AwsStsResp, endpoint: string) {
  const explicitForcePathStyle = sts.force_path_style ?? sts.forcePathStyle
  if (typeof explicitForcePathStyle === "boolean") {
    return explicitForcePathStyle
  }

  try {
    const endpointUrl = new URL(endpoint)

    if (endpointUrl.pathname && endpointUrl.pathname !== "/") {
      return true
    }

    if (endpointUrl.hostname.endsWith(".aliyuncs.com")) {
      return false
    }
  } catch {
    return true
  }

  return true
}

export function mapStsToAwsS3Token(sts: AwsStsResp): AwsS3Token {
  const endpoint = normalizeEndpoint(pick(sts.endpoint))

  return {
    region: pick(sts.region),
    endpoint,
    accessKeyId: pick(sts.access_key_id, sts.accessKeyId),
    accessKeySecret: pick(sts.access_key_secret, sts.accessKeySecret),
    bucket: pick(sts.bucket),
    sessionToken: pick(sts.security_token, sts.securityToken),
    credentialScope: sts.credential_scope ?? sts.credentialScope,
    accountId: sts.account_id ?? sts.accountId,
    forcePathStyle: resolveForcePathStyle(sts, endpoint),
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
  uploadOptions,
}: UploadAwsObjectParams) {
  const sts = await getSts()
  const token = mapStsToAwsS3Token(sts)
  const result = await uploadFile(file, folder, token, uploadOptions)

  return buildAwsObjectUrl(token, result.path)
}
