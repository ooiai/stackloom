/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { toast } from "sonner"
import { AxiosError } from "axios"
import { ROUTER_ENUM, STORAGE_ENUM } from "../config/enums"
import { removeStorageItem } from "@/hooks/use-persisted-state"
import { BizErrorCode, HttpStatusCode } from "./status"

// Define the error response interface
export interface ErrorResponse {
  code: BizErrorCode
  message: string
  data: any
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

// Check if error code is in the data error range (410000-41999)
export const isDataError = (code: BizErrorCode): boolean => {
  return code >= 410000 && code <= 419999
}

// Custom hook for error handling with translations
export function useAxiosErrorHandler() {
  // 处理业务错误码
  const handleBizError = (error: ErrorResponse) => {
    // If error code is 400007
    if (error.code === BizErrorCode.BIZ_DATA_ERROR) {
      return Promise.reject(error)
    }
    // If error code is in 410000-41999 range, don't show toast message
    if (isDataError(error.code)) {
      return Promise.reject(error)
    }
    switch (error.code) {
      // 4xx Client Error
      case BizErrorCode.VALIDATION_ERROR:
        toast.warning("Parameter validation failed")
        break
      case BizErrorCode.UNAUTHORIZED:
        toast.warning("Please log in again (not logged in or login expired)")
        removeStorageItem(STORAGE_ENUM.TOKEN)
        window.location.href = ROUTER_ENUM.SIGNIN
        break
      case BizErrorCode.FORBIDDEN:
        toast.warning("Permission denied")
        break
      case BizErrorCode.NOT_FOUND:
        toast.warning("Resource does not exist")
        break
      case BizErrorCode.TOKEN_EXPIRED:
        toast.warning("Authorization expired, please log in again")
        break
      case BizErrorCode.CONFLICT:
        toast.warning("Resource conflict")
        break
      case BizErrorCode.BIZ_CLIENT_ERROR:
        toast.warning(
          error?.message || "Client error: An unexpected error occurred"
        )
        break
      case BizErrorCode.UNPROCESSABLE_ENTITY:
        toast.warning("Business rule validation failed")
        break
      case BizErrorCode.RATE_LIMIT:
        toast.warning("Request frequency exceeded limit")
        break
      case BizErrorCode.EASTER_EGG:
        toast.warning("🫖 Fun easter egg")
        break

      // 5xx Server Error
      case BizErrorCode.DB_ERROR:
        toast.error("Database service exception")
        break
      case BizErrorCode.REDIS_ERROR:
        toast.error("Cache service exception")
        break
      case BizErrorCode.MQ_ERROR:
        toast.error("Message queue service exception")
        break
      case BizErrorCode.EXTERNAL_ERROR:
        toast.error("External service call failed")
        break
      case BizErrorCode.INTERNAL_ERROR:
        toast.error("Internal system error")
        break
      default:
        toast.error("Unknown error: An unexpected error occurred")
    }
  }

  // 处理 HTTP 状态码
  const handleHttpError = (error: AxiosError<ErrorResponse>) => {
    const { status } = error
    switch (status) {
      case HttpStatusCode.BAD_REQUEST:
        toast.error("Request error: Incorrect request parameter format")
        break
      case HttpStatusCode.UNAUTHORIZED:
        toast.error("Unauthorized access: Please log in again")
        console.log(error)
        removeStorageItem(STORAGE_ENUM.TOKEN)
        window.location.href = ROUTER_ENUM.SIGNIN
        break
      case HttpStatusCode.FORBIDDEN:
        toast.error(
          "Access restricted: You don't have permission to access this resource"
        )
        break
      case HttpStatusCode.NOT_FOUND:
        toast.error("Resource not found: The requested resource does not exist")
        break
      case HttpStatusCode.CONFLICT:
        toast.error("Operation conflict: Resource state conflict")
        break
      case HttpStatusCode.EXPECTATION_FAILED:
        toast.error(
          "Operation failed: Please check the request parameters and try again"
        )
        break
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        toast.error("Data validation failed: Request data validation failed")
        break
      case HttpStatusCode.TOO_MANY_REQUESTS:
        toast.error("Too many requests: Please try again later")
        break
      case HttpStatusCode.IM_A_TEAPOT:
        toast.error("🫖: I'm a teapot")
        break
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
        toast.error("Server error: The server failed to process the request")
        break
      default:
        toast.error("Network error: Failed to connect to the server")
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
      toast.error(
        "Network connection failed: Failed to establish a connection with the server"
      )
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
