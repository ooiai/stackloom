/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "crypto-js"
declare module "pako"
declare module "lodash-es"

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config?: any)
    send(command: any): Promise<any>
  }

  export class PutObjectCommand {
    constructor(input?: any)
  }

  export class HeadObjectCommand {
    constructor(input?: any)
  }

  export class NotFound extends Error {}

  export type PutObjectCommandOutput = any
}
