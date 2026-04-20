"use client"
import { useEffect } from "react"
import { setErrorHandler } from "../lib/http/axios"
import { useAxiosErrorHandler } from "../lib/http/axios-validate"

// Component to setup axios error handling with proper hooks
export const AxiosErrorHandler: React.FC = () => {
  const { handleAxiosError } = useAxiosErrorHandler()

  useEffect(() => {
    // Set the error handler once the component mounts
    setErrorHandler(handleAxiosError)

    // No cleanup needed as we don't want to remove the handler
  }, [handleAxiosError])

  return null // This component doesn't render anything
}
