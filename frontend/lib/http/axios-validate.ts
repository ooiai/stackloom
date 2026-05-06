/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { toast } from "sonner"
import { AxiosError } from "axios"
import { useI18n } from "@/providers/i18n-provider"
import { ROUTER_ENUM, STORAGE_ENUM } from "../config/enums"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import { BizErrorCode, HttpStatusCode } from "./status"

// Define the error response interface
export interface ErrorResponse {
  code: BizErrorCode
  message: string
  data: any
  errorKey?: string // Stable i18n key returned by backend DataError variants
}

// Utility functions that don't depend on translations
export const isAuthError = (error: AxiosError<ErrorResponse>): boolean => {
  return (
    error.response?.status === HttpStatusCode.UNAUTHORIZED ||
    error.response?.data?.code === BizErrorCode.UNAUTHORIZED
  )
}

export const isValidationError = (
  error: AxiosError<ErrorResponse>
): boolean => {
  return (
    error.response?.status === HttpStatusCode.UNPROCESSABLE_ENTITY ||
    error.response?.data?.code === BizErrorCode.VALIDATION_ERROR
  )
}

export const isForbiddenError = (error: AxiosError<ErrorResponse>): boolean => {
  return (
    error.response?.status === HttpStatusCode.FORBIDDEN ||
    error.response?.data?.code === BizErrorCode.FORBIDDEN
  )
}

export const isRateLimitError = (error: AxiosError<ErrorResponse>): boolean => {
  return (
    error.response?.status === HttpStatusCode.TOO_MANY_REQUESTS ||
    error.response?.data?.code === BizErrorCode.RATE_LIMIT
  )
}

// Custom hook for error handling with translations
export function useAxiosErrorHandler() {
  const { t } = useI18n()

  // 处理业务错误码
  const handleBizError = (error: ErrorResponse) => {
    // Prefer stable string key returned by backend DataError
    if (error.errorKey) {
      toast.warning(t(error.errorKey))
      return Promise.reject(error)
    }

    // Generic fallback handling by numeric code
    switch (error.code) {
      // 4xx Client Error
      case BizErrorCode.VALIDATION_ERROR:
        toast.warning(t("errors.http.validation"))
        break
      case BizErrorCode.UNAUTHORIZED:
        toast.warning(t("errors.http.unauthorized"))
        removeStorageItem(STORAGE_ENUM.TOKEN)
        window.location.href = ROUTER_ENUM.SIGNIN
        break
      case BizErrorCode.FORBIDDEN:
        toast.warning(t("errors.http.forbidden"))
        break
      case BizErrorCode.NOT_FOUND:
        toast.warning(t("errors.http.notFound"))
        break
      case BizErrorCode.TOKEN_EXPIRED:
        toast.warning(t("errors.http.tokenExpired"))
        break
      case BizErrorCode.CONFLICT:
        toast.warning(t("errors.http.conflict"))
        break
      case BizErrorCode.BIZ_CLIENT_ERROR:
        toast.warning(t("errors.http.clientError"))
        break
      case BizErrorCode.BIZ_DATA_ERROR:
        toast.warning(t("errors.http.dataConflict"))
        break
      case BizErrorCode.UNPROCESSABLE_ENTITY:
        toast.warning(t("errors.http.unprocessableEntity"))
        break
      case BizErrorCode.RATE_LIMIT:
        toast.warning(t("errors.http.rateLimit"))
        break
      case BizErrorCode.EASTER_EGG:
        toast.warning(t("errors.http.easterEgg"))
        break

      // 5xx Server Error
      case BizErrorCode.DB_ERROR:
        toast.error(t("errors.http.database"))
        break
      case BizErrorCode.REDIS_ERROR:
        toast.error(t("errors.http.redis"))
        break
      case BizErrorCode.MQ_ERROR:
        toast.error(t("errors.http.messageQueue"))
        break
      case BizErrorCode.EXTERNAL_ERROR:
        toast.error(t("errors.http.external"))
        break
      case BizErrorCode.INTERNAL_ERROR:
        toast.error(t("errors.http.internal"))
        break
      default:
        toast.error(t("errors.http.unknown"))
    }
    return Promise.reject(error)
  }

  // 处理 HTTP 状态码
  const handleHttpError = (error: AxiosError<ErrorResponse>) => {
    const { status } = error

    switch (status) {
      case HttpStatusCode.BAD_REQUEST:
        toast.error(t("errors.http.badRequest"))
        break
      case HttpStatusCode.UNAUTHORIZED:
        toast.error(t("errors.http.unauthorized"))
        console.log(error)
        removeStorageItem(STORAGE_ENUM.TOKEN)
        window.location.href = ROUTER_ENUM.SIGNIN
        break
      case HttpStatusCode.FORBIDDEN:
        toast.error(t("errors.http.forbidden"))
        break
      case HttpStatusCode.NOT_FOUND:
        toast.error(t("errors.http.notFound"))
        break
      case HttpStatusCode.CONFLICT:
        toast.error(t("errors.http.conflict"))
        break
      case HttpStatusCode.EXPECTATION_FAILED:
        toast.error(t("errors.http.clientError"))
        break
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        toast.error(t("errors.http.unprocessableEntity"))
        break
      case HttpStatusCode.TOO_MANY_REQUESTS:
        toast.error(t("errors.http.rateLimit"))
        break
      case HttpStatusCode.IM_A_TEAPOT:
        toast.error(t("errors.http.easterEgg"))
        break
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        toast.error(t("errors.http.internal"))
        break
      default:
        toast.error(t("errors.http.network"))
    }
  }

  // 主要的错误处理函数
  const handleAxiosError = (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response
      if (data?.code) {
        handleBizError(data)
      } else {
        handleHttpError(error)
      }
      console.debug("Axios API Error:", {
        status,
        bizCode: data?.code,
        message: data?.message,
        url: error.config?.url,
        method: error.config?.method,
      })
    } else if (error.request) {
      toast.error(t("errors.http.network"))
      console.error("Network Error:", error.request)
    } else {
      console.error("Request Config Error:", error)
    }
    return Promise.reject(error)
  }

  return {
    handleAxiosError,
  }
}

// Create a default error handler for non-React contexts (like in axios.ts)
// This won't have translations but can be a fallback
export const defaultHandleAxiosError = (error: AxiosError<ErrorResponse>) => {
  // console.error("defaultHandleAxiosError:", error);
  if (error.response) {
    const { status, data } = error.response
    // Log details but don't show toast messages since we don't have translations
    console.error("Axios API Error:", {
      status,
      bizCode: data?.code,
      message: data?.message,
      url: error.config?.url,
      method: error.config?.method,
    })
  } else if (error.request) {
    console.error("Network Error:", error.request)
  } else {
    console.error("Request Config Error:", error)
  }
  return Promise.reject(error)
}
