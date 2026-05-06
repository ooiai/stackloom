import { HeadObjectCommand, NotFound, S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { fileChecksum } from "../lib/core"

export type AwsS3Token = {
  // The region where the S3 bucket is located.
  region: string
  // The endpoint of the S3 service.
  endpoint: string
  // The access key ID for the S3 service.
  accessKeyId: string
  // The access key secret for the S3 service.
  accessKeySecret: string
  // The bucket name for the S3 service.
  bucket: string
  // The session token for the S3 service.
  sessionToken: string
  // AWS credential scope for this set of credentials.
  credentialScope?: string
  // AWS accountId.
  accountId?: string
  // Whether to force path style URLs for S3 objects
  // https://s3.amazonaws.com/<bucketName>/<key> instead of https://<bucketName>.s3.amazonaws.com/<key>
  // Must be true to be compatible with Minio
  forcePathStyle: boolean
}

type UploadFileKeyStrategy = "checksum" | "unique"

export type UploadFileOptions = {
  keyStrategy?: UploadFileKeyStrategy
  onProgress?: (percent: number) => void
  /**
   * Minimum size (bytes) of each multipart chunk.
   * When the file is smaller than this value, `@aws-sdk/lib-storage` falls back
   * to a single `PutObject` request instead of multipart upload.
   *
   * Default: 5 MiB (SDK default).
   * For export flows (PDF/large blobs) pass `100 * 1024 * 1024` to avoid
   * multipart entirely for files up to 100 MiB — prevents the RustFS/MinIO
   * "One or more specified parts could not be found" ETag-mismatch error.
   */
  partSizeBytes?: number
}

export const createAwsS3Uploader = () => {
  const Client = (stsToken: AwsS3Token) => {
    return new S3Client({
      region: stsToken?.region,
      endpoint: stsToken?.endpoint,
      credentials: {
        accessKeyId: stsToken?.accessKeyId,
        secretAccessKey: stsToken?.accessKeySecret,
        sessionToken: stsToken?.sessionToken,
        credentialScope: stsToken?.credentialScope,
        accountId: stsToken?.accountId,
      },
      forcePathStyle: stsToken?.forcePathStyle || false,
    })
  }

  const normalizeFolder = (folder: string) =>
    folder.trim().replace(/^\/+/, "").replace(/\/+$/, "")

  const getFileExtension = (file: File) => {
    const name = file.name || "upload"
    const lastDot = name.lastIndexOf(".")
    if (lastDot < 0 || lastDot === name.length - 1) return "bin"
    return name.slice(lastDot + 1).toLowerCase()
  }

  const makeUniqueUploadKey = (folder: string, file: File) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    return `${normalizeFolder(folder)}/${Date.now()}-${id}.${getFileExtension(file)}`
  }

  const makeChecksumUploadKey = async (folder: string, file: File) => {
    const checksum = await fileChecksum(file)
    return {
      checksum,
      uploadKey: `${normalizeFolder(folder)}/${checksum}.${getFileExtension(file)}`,
    }
  }

  /**
   * Upload a file to S3.
   * @param file
   * @param folder
   * @param token
   * @returns
   */
  const uploadFile = async (
    file: File,
    folder: string,
    token: AwsS3Token,
    options: UploadFileOptions = {}
  ) => {
    const client = Client(token)
    const bucketName = token?.bucket
    if (!bucketName) {
      throw new Error("Bucket name is required")
    }

    const name = file.name
    const names = name.split(".")
    const keyStrategy = options.keyStrategy ?? "checksum"
    const checksumKey =
      keyStrategy === "checksum"
        ? await makeChecksumUploadKey(folder, file)
        : null
    const checksum = checksumKey?.checksum ?? ""
    const uploadKey =
      checksumKey?.uploadKey ?? makeUniqueUploadKey(folder, file)
    // await exists(uploadKey, token);
    const uploader = new Upload({
      client,
      partSize: options.partSizeBytes,
      params: {
        Bucket: bucketName,
        Key: uploadKey,
        Body: file,
        ContentType: file.type || "application/octet-stream",
      },
    })

    uploader.on("httpUploadProgress", (progress) => {
      if (!options.onProgress) return
      const loaded = progress.loaded ?? 0
      const total = progress.total ?? file.size
      if (!total || total <= 0) return
      const percent = Math.max(
        0,
        Math.min(100, Math.round((loaded / total) * 100))
      )
      options.onProgress(percent)
    })

    const result = await uploader.done()
    return {
      path: uploadKey,
      checksum: checksum,
      name: names,
      etag: result.ETag,
      size: file.size.toString(),
    }
  }

  /**
   * Upload multiple files to S3.
   * @param files
   * @param folder
   * @param token
   * @returns
   */
  const upload = async (files: File[], folder: string, token: AwsS3Token) =>
    Promise.all(files.map((file) => uploadFile(file, folder, token)))

  const exists = async (key: string, token: AwsS3Token) => {
    const client = Client(token)
    const bucketName = token?.bucket
    if (!bucketName) {
      throw new Error("Bucket name is required")
    }
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      )
      return true
    } catch (error) {
      if (error instanceof NotFound) {
        return false
      }
      throw error
    }
  }

  return { upload, exists, uploadFile }
}

export const useAwsS3 = () => {
  return createAwsS3Uploader()
}
