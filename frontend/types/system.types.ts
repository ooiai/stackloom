export interface SliderCaptcha {
  code: string
  account: string
  password?: string
}

export type AwsSts = Record<string, never>

export type SmsSignin = Record<string, never>

export interface AwsStsResp {
  access_key_id?: string
  accessKeyId?: string
  access_key_secret?: string
  accessKeySecret?: string
  security_token?: string
  securityToken?: string
  expiration: string
  endpoint: string
  region: string
  bucket: string
  credential_scope?: string
  credentialScope?: string
  account_id?: string
  accountId?: string
  force_path_style?: boolean
  forcePathStyle?: boolean
}

export interface AwsSignUrlReq {
  path: string
  expires_in?: number
}

export interface AwsSignUrlResp {
  signed_url: string
}

export interface AwsUploadRemoteImageReq {
  url: string
  folder?: string
}

export interface AwsUploadRemoteImageResp {
  path: string
}

export type AwsRemoteResourceType =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "any"

export interface AwsUploadRemoteObjectReq {
  url: string
  folder?: string
  resource_type?: AwsRemoteResourceType
}

export interface AwsUploadRemoteObjectResp {
  path: string
}
