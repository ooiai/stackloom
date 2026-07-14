import { useMemo } from "react"

import { useQuery } from "@tanstack/react-query"

import { captchaApi } from "@/stores/system-api"

export const CAPTCHA_DISABLED_CODE = "captcha_slider_disabled"

export const CAPTCHA_SLIDER_PROVIDER = "captcha_slider"

export function useCaptchaSliderConfig() {
  const query = useQuery({
    queryKey: ["system", "captcha-slider-config"],
    queryFn: captchaApi.getSliderConfig,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

  const enabled = useMemo(() => {
    if (!query.data) {
      return true
    }

    return query.data.enabled && query.data.provider === CAPTCHA_SLIDER_PROVIDER
  }, [query.data])

  return {
    ...query,
    enabled,
    config: query.data,
  }
}

