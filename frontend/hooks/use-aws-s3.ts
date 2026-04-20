/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3"
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

  /**
   * Upload a file to S3.
   * @param file
   * @param folder
   * @param token
   * @returns
   */
  const uploadFile = async (file: File, folder: string, token: AwsS3Token) => {
    const client = Client(token)
    const bucketName = token?.bucket
    if (!bucketName) {
      throw new Error("Bucket name is required")
    }

    const checksum = await fileChecksum(file)
    const name = file.name
    const names = name.split(".")
    const ext: any = names[names.length - 1]
    // const uploadKey = folder + "/" + name;
    const uploadKey = folder + "/" + checksum + "." + ext
    // await exists(uploadKey, token);
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const result: PutObjectCommandOutput = await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uploadKey,
        Body: fileBuffer,
        ContentType: file.type,
      })
    )
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
  const upload = async (files: File[], folder: string, token: AwsS3Token) => {
    const client = Client(token)
    const bucketName = token?.bucket
    if (!bucketName) {
      throw new Error("Bucket name is required")
    }
    const uploads = await Promise.all(
      files.map(async (file: File) => {
        const checksum = await fileChecksum(file)
        const name = file.name
        const names = name.split(".")
        const ext: any = names[names.length - 1]
        // const uploadKey = folder + "/" + name;
        const uploadKey = folder + "/" + checksum + "." + ext
        // await exists(uploadKey, token);
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)
        const result: PutObjectCommandOutput = await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: uploadKey,
            Body: fileBuffer,
            ContentType: file.type,
          })
        )
        return {
          path: uploadKey,
          checksum: checksum,
          name: names,
          etag: result.ETag,
          size: file.size.toString(),
        }
      })
    )
    return uploads
  }

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
