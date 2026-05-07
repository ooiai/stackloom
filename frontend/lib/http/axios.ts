/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { IS_DEV } from "@/lib/config/constants"
import { PUBLIC_BASE_URL } from "@/lib/config/constants"
import {
  API_ENUM,
  HTTP_REQUEST_ENUM,
  ROUTER_ENUM,
  STORAGE_ENUM,
} from "../config/enums"
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@/hooks/use-persisted-state"
import CryptUtil from "@/lib/crypt"
import DeviceUtils from "@/lib/deviceutils"
import SignUtils from "@/lib/signutils"

import { toast } from "sonner"
import { getFingerprint } from "@/lib/core"
import axios, {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
  Canceler,
} from "axios"
import { isEmpty } from "lodash-es"
import { defaultHandleAxiosError } from "./axios-validate"
import { BizErrorCode } from "./status"

export interface AuthTokenResult {
  access_token: string
  expires_at: number
  refresh_token: string
  refresh_expires_at: number
}

const secretKey = process.env.NEXT_PUBLIC_SIGIN || ""

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: any) => void
}> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

let refreshTokenPromise: Promise<string | null> | null = null

export async function refreshToken(): Promise<string | null> {
  if (!refreshTokenPromise) {
    const storeToken = getStoreToken()
    // console.log("refreshToken storeToken:", storeToken);
    const access_token = storeToken?.access_token
    const refresh_token = storeToken?.refresh_token
    if (!refresh_token) return null
    refreshTokenPromise = post(
      API_ENUM.REFRESH_TOKEN,
      { refresh_token, access_token },
      {
        headers: {
          Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_REFRESH_TOKEN)}`,
        },
      }
    )
      .then((res) => {
        const { access_token, refresh_token, refresh_expires_at } = res
        if (access_token && refresh_token) {
          setStorageItem(
            STORAGE_ENUM.TOKEN,
            JSON.stringify({ access_token, refresh_token }),
            refresh_expires_at
          )
        }
        return access_token
      })
      .catch(() => null)
      .finally(() => {
        refreshTokenPromise = null
      })
  }
  return refreshTokenPromise
}

export interface ResponseData<T = any> {
  code: number
  data: T
  message: string
}

export interface UploadOptions extends Omit<AxiosRequestConfig, "cancelToken"> {
  onProgress?: (progressEvent: AxiosProgressEvent) => void
}

export interface DownloadOptions extends Omit<
  AxiosRequestConfig,
  "cancelToken"
> {
  filename?: string
  onProgress?: (progressEvent: AxiosProgressEvent) => void
}

export interface SSECallback {
  (data: any): void
}

export interface PathParams {
  [key: string]: string | number
}

export const ContentType = {
  json: "application/json",
  stream: "text/event-stream",
  audio: "audio/mpeg",
  form: "application/x-www-form-urlencoded; charset=UTF-8",
  download: "application/octet-stream",
  upload: "multipart/form-data",
} as const

export const DEFAULT_CONFIG = {
  baseURL: PUBLIC_BASE_URL,
  timeout: 180000,
  headers: {
    "Content-Type": ContentType.json,
  },
} as const

// axios instance
const instance: AxiosInstance = axios.create({
  ...DEFAULT_CONFIG,
  withCredentials: true,
  responseType: "arraybuffer",
})

// Store pending requests
const pendingRequests = new Map<string, Canceler>()

// Error handler reference - will be set by setErrorHandler
let handleAxiosError = defaultHandleAxiosError

// Function to update the error handler from React components
export const setErrorHandler = (handler: typeof handleAxiosError) => {
  handleAxiosError = handler
}

// Function to add authentication headers to the request
const addAuthHeaders = (config: AxiosRequestConfig, token: string) => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
    Scope: config.headers?.Scope || HTTP_REQUEST_ENUM.SCOPE,
  }
}

// Add extension headers to the request
const addExtensionHeaders = (
  config: AxiosRequestConfig,
  storeToken: string | undefined,
  requestToken: string
) => {
  // console.log("storeToken:", storeToken);
  const { deviceInfo, encodeDeviceInfo } = DeviceUtils.getDeviceInfo(
    storeToken || requestToken
  )
  const timestamp = Math.floor(Date.now() / 1000)
  const method = config.method?.toUpperCase() || "GET"
  const uri = config.url || ""
  const body = config.data ? JSON.stringify(config.data) : ""
  const params = config.params || {}
  const signature = SignUtils.gen(
    timestamp,
    method,
    uri,
    body,
    params,
    secretKey
  )
  config.headers = {
    ...config.headers,
    "X-Device-Info": JSON.stringify(deviceInfo),
    "X-Signature": signature,
    "X-Timestamp": timestamp,
    "X-Device-ID": encodeDeviceInfo,
    "X-Client-ID": HTTP_REQUEST_ENUM.CLIENTID,
    "X-REQ-ID": requestToken,
  }
}

// Function to encrypt request data and params
export const encryptReqData = (
  config: AxiosRequestConfig,
  storeToken: string
) => {
  // Skip if already encrypted (ArrayBuffer or Uint8Array from a previous attempt,
  // e.g. during token-refresh retry) — double-encrypting produces garbage.
  if (
    config.data &&
    !(config.data instanceof ArrayBuffer) &&
    !(config.data instanceof Uint8Array)
  ) {
    config.data = CryptUtil.encryptCompressData(config.data || {}, storeToken)
  }
  // if (config.params && !(config.params instanceof ArrayBuffer)) {
  //   config.params = CryptUtil.encryptCompressData(
  //     config.params || {},
  //     storeToken,
  //   );
  // }
}

const decryptResData = (response: AxiosResponse<any, any>) => {
  const { data } = response || {}
  let resultData = data
  let decryptedText = ""
  try {
    decryptedText = CryptUtil.decompressDecryptData(data)
  } catch (error) {
    console.error("Response data is invalid or Decryption failed:", error)
    toast.error("Response data is invalid or Decryption failed!")
    return Promise.reject(data)
  }
  if (isEmpty(decryptedText)) {
    // toast.error("服务器异常，请稍后再试！");
    toast.error("Server error, please try again later!")
    return Promise.reject(data)
  }
  try {
    resultData = JSON.parse(decryptedText)
  } catch (error: any) {
    console.error("Failed to parse decrypted response data:", error)
    resultData = decryptedText
  }

  // console.log(resultData);

  return resultData
}

// Function to generate a unique key for a request
const getRequestKey = (config: AxiosRequestConfig): string => {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join("&")
}

export const getStoreToken = (): AuthTokenResult | null => {
  const storeToken = getStorageItem(STORAGE_ENUM.TOKEN)
  return (storeToken && JSON.parse(storeToken)) || null
}

const cancelPendingRequest = (key: string) => {
  const canceler = pendingRequests.get(key)
  if (canceler) {
    canceler()
    pendingRequests.delete(key)
  }
}

// Function to handle request errors
instance.interceptors.request.use(
  async (config: any) => {
    // Cancel previous request
    if (config.cancelPrevious) {
      const requestKey = getRequestKey(config)
      cancelPendingRequest(requestKey)
      config.cancelToken = new axios.CancelToken((cancel) => {
        pendingRequests.set(requestKey, cancel)
      })
    }
    // Generate the request token
    // const requestToken = CoreUtils.genToken();
    const requestToken = getFingerprint()
    // console.log(requestToken);
    // Add the login store token
    const storeToken = getStoreToken()
    if (storeToken && !config.headers?.Authorization) {
      // config.headers = config.headers || {};
      // config.headers.Authorization = `Bearer ${storeToken?.access_token}`;
      addAuthHeaders(config, storeToken.access_token)
    }
    // Add the extension headers
    addExtensionHeaders(config, storeToken?.access_token, requestToken)
    const skipEncrypt =
      config.headers?.["X-Skip-Encrypt"] === "1" ||
      config.headers?.["x-skip-encrypt"] === "1"
    if (skipEncrypt && config.headers) {
      delete config.headers["X-Skip-Encrypt"]
      delete config.headers["x-skip-encrypt"]
    }
    // Encrypt request data
    if (!skipEncrypt) {
      encryptReqData(config, storeToken?.access_token || requestToken)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    const config = response.config as AxiosRequestConfig
    const requestKey = getRequestKey(config)
    pendingRequests.delete(requestKey)
    try {
      const resultData = decryptResData(response)
      return resultData
    } catch (error) {
      console.error(error)
      return response.data
    }
  },
  async (error) => {
    // console.error("error:", error);
    if (axios.isCancel(error)) {
      // console.log("Request canceled:", error.message);
      return Promise.reject(error)
    }

    if (error.config) {
      const requestKey = getRequestKey(error.config)
      pendingRequests.delete(requestKey)
    }

    const resultData = decryptResData(error.response)
    if (IS_DEV) {
      console.debug("http error response:", resultData)
    }

    if (error.response && resultData) {
      error.response.data = resultData
    }

    const code = resultData?.code || error.response?.status

    const originalRequest = error.config

    // refresh token
    if (code === BizErrorCode.TOKEN_EXPIRED && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(instance(originalRequest))
            },
            reject: (err: any) => {
              reject(err)
            },
          })
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const newToken = await refreshToken()
        // console.log("newToken:", newToken);
        if (newToken) {
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return instance(originalRequest)
        } else {
          processQueue(error, null)
          // clear token
          removeStorageItem(STORAGE_ENUM.TOKEN)
          window.location.href = ROUTER_ENUM.SIGNIN
          return Promise.reject(error)
        }
      } catch (err) {
        processQueue(err, null)
        // clear token
        removeStorageItem(STORAGE_ENUM.TOKEN)
        window.location.href = ROUTER_ENUM.SIGNIN
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return handleAxiosError(error)
  }
)

// The HTTP methods is get
export const get = async <T = any>(
  url: string,
  params?: any,
  config?: Omit<AxiosRequestConfig, "cancelToken">
): Promise<T> => {
  try {
    return await instance.get(url, {
      params,
      ...config,
      headers: {
        "Content-Type": ContentType.json,
        ...(config?.headers || {}),
      },
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is post
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: Omit<AxiosRequestConfig, "cancelToken">
): Promise<T> => {
  try {
    return await instance.post(url, data, config)
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is put
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: Omit<AxiosRequestConfig, "cancelToken">
): Promise<T> => {
  try {
    return await instance.put(url, data, config)
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is delete
export const del = async <T = any>(
  url: string,
  params?: any,
  config?: Omit<AxiosRequestConfig, "cancelToken">
): Promise<T> => {
  try {
    return await instance.delete(url, {
      params,
      ...config,
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is upload
export const upload = async <T = any>(
  url: string,
  file: File | Blob,
  options: UploadOptions = {}
): Promise<T> => {
  const formData = new FormData()
  formData.append("file", file)

  try {
    return await instance.post(url, formData, {
      headers: {
        "Content-Type": ContentType.upload,
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        options.onProgress?.(progressEvent)
      },
      ...options,
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is download
export const download = async (
  url: string,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    const response = await instance.get(url, {
      responseType: "blob",
      headers: {
        "Content-Type": ContentType.download,
      },
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        options.onProgress?.(progressEvent)
      },
      ...options,
    })

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = options.filename || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is sse
// export const sse = async (
//   url: string,
//   callback: SSECallback,
// ): Promise<void> => {
//   try {
//     const eventSource = new EventSource(url);

//     eventSource.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       console.log("data:", data?.type);
//       eventSource.close();
//       if (data?.type === "error") {
//         eventSource.close();
//         throw new Error(data.error);
//       }
//       callback(data);
//     };

//     eventSource.onerror = (error) => {
//       console.error("error:", error);
//       eventSource.close();
//       throw error;
//     };
//   } catch (error) {
//     console.error("the error:", error);
//     return Promise.reject(error);
//   }
// };

export const sse = (
  url: string,
  callback: SSECallback
): Promise<EventSource> => {
  let eventSource: EventSource | null = null
  let closed = false
  let resolved = false

  // 返回的 Promise，onopen 时 resolve
  let resolve: (es: EventSource) => void
  const promise = new Promise<EventSource>((res) => {
    resolve = res
  })

  const connect = async () => {
    const storeToken = getStoreToken()
    const accessToken = storeToken?.access_token
    const urlObj = new URL(url, window.location.origin)
    if (accessToken) urlObj.searchParams.set("accessToken", accessToken)

    eventSource = new EventSource(urlObj.toString())
    eventSource.onopen = () => {
      if (!resolved) {
        resolved = true
        resolve(eventSource!)
      }
    }

    eventSource.onmessage = async (event) => {
      if (closed) return
      let data: any = null
      try {
        data = JSON.parse(event?.data)
      } catch {
        data = event?.data
      }
      if (
        data &&
        (data.code === 401 || data.code === BizErrorCode.TOKEN_EXPIRED)
      ) {
        eventSource?.close()
        const newToken = await refreshToken()
        if (newToken && !closed) {
          connect()
        } else {
          removeStorageItem(STORAGE_ENUM.TOKEN)
          window.location.href = ROUTER_ENUM.SIGNIN
        }
        return
      }
      callback(data)
    }
    eventSource.onerror = async () => {
      if (closed) return
      if (eventSource?.readyState === 2) {
        eventSource.close()
        const newToken = await refreshToken()
        if (newToken && !closed) {
          connect()
        } else {
          removeStorageItem(STORAGE_ENUM.TOKEN)
          window.location.href = ROUTER_ENUM.SIGNIN
        }
      }
    }
  }

  connect()
  ;(promise as any).safeClose = () => {
    closed = true
    eventSource?.close()
  }

  return promise
}

type SSEStatus = "connecting" | "open" | "closed" | "error"

export const createSSE = (
  url: string,
  callback: SSECallback,
  options?: {
    onStatusChange?: (status: SSEStatus) => void
  }
) => {
  let eventSource: EventSource | null = null
  let closed = false
  let resolved = false

  const notifyStatus = (status: SSEStatus) => {
    options?.onStatusChange?.(status)
  }

  const connect = async (): Promise<void> => {
    notifyStatus("connecting")

    const storeToken = getStoreToken()
    const accessToken = storeToken?.access_token
    const urlObj = new URL(url, window.location.origin)
    if (accessToken) urlObj.searchParams.set("accessToken", accessToken)

    eventSource = new EventSource(urlObj.toString())

    eventSource.onopen = () => {
      if (!resolved) {
        resolved = true
      }
      notifyStatus("open")
      console.log("[SSE] connected.")
    }

    eventSource.onmessage = async (event) => {
      if (closed) return
      let data: any = null
      try {
        data = JSON.parse(event?.data)
      } catch {
        data = event?.data
      }

      if (
        data &&
        (data.code === 401 || data.code === BizErrorCode.TOKEN_EXPIRED)
      ) {
        eventSource?.close()
        const newToken = await refreshToken()
        if (newToken && !closed) {
          connect()
        } else {
          notifyStatus("closed")
          // useAuthStore.getState().clearLocalStorage();
          console.error("401 REFRESH_TOKEN newToken:{}", newToken)
          // window.location.href = ROUTER_ENUM.SIGNIN;
        }
        return
      }

      callback(data)
    }

    eventSource.onerror = async () => {
      if (closed) return
      notifyStatus("error")

      if (eventSource?.readyState === 2) {
        eventSource.close()
        const newToken = await refreshToken()
        if (newToken && !closed) {
          connect()
        } else {
          notifyStatus("closed")
          console.error("401 onerror newToken:{}", newToken)
          // useAuthStore.getState().clearLocalStorage();
          // window.location.href = ROUTER_ENUM.SIGNIN;
        }
      }
    }
  }

  return {
    start: async () => {
      if (closed) return
      if (!eventSource) await connect()
    },
    close: () => {
      closed = true
      eventSource?.close()
      notifyStatus("closed")
      eventSource = null
    },
    getInstance: () => eventSource,
  }
}

// The HTTP methods is path
export const path = async <T = any>(
  url: string,
  pathParams: PathParams,
  config?: Omit<AxiosRequestConfig, "cancelToken">
): Promise<T> => {
  try {
    let path = url
    Object.entries(pathParams).forEach(([key, value]) => {
      path = path.replace(`:${key}`, String(value))
    })

    return await instance.get(path, config)
  } catch (error) {
    return Promise.reject(error)
  }
}

// The HTTP methods is cancelAllRequests
export const cancelAllRequests = () => {
  pendingRequests.forEach((canceler) => canceler())
  pendingRequests.clear()
}
