export interface StorageProviderData {
  code: string
  label: string
  bucket: string
  endpoint: string
}

export interface GetStorageResult {
  providers: StorageProviderData[]
  default_provider: string
}

export interface StorageObjectData {
  provider: string
  bucket: string
  key: string
  size: number
  etag: string | null
  last_modified: string | null
  storage_class: string | null
  public_url: string
}

export interface PageStorageParam {
  provider: string
  bucket?: string
  prefix?: string
  continuation_token?: string
  page_size?: number
}

export interface PageStorageResult {
  provider: StorageProviderData
  items: StorageObjectData[]
  next_token: string | null
  is_truncated: boolean
}

export interface SignStorageParam {
  provider: string
  bucket?: string
  key: string
  expires_in?: number
}

export interface SignStorageResult {
  signed_url: string
}
