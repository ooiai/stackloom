import { post } from "@/lib/http/axios"
import type {
  GetStorageResult,
  PageStorageParam,
  PageStorageResult,
  SignStorageParam,
  SignStorageResult,
} from "@/types/storage.types"

const BASE_STORAGE_API_PREFIX = "/apiv1/base/storage"

export const storageApi = {
  get: async (): Promise<GetStorageResult> => {
    return post(`${BASE_STORAGE_API_PREFIX}/get`, {})
  },
  page: async (params: PageStorageParam): Promise<PageStorageResult> => {
    return post(`${BASE_STORAGE_API_PREFIX}/page`, params)
  },
  sign: async (params: SignStorageParam): Promise<SignStorageResult> => {
    return post(`${BASE_STORAGE_API_PREFIX}/sign`, params)
  },
}
