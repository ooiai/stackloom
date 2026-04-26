"use client"

import { useEffect, useRef, useState } from "react"

import { useMutation } from "@tanstack/react-query"
import SliderCaptcha, {
  type ActionType,
  Status,
  type VerifyParam,
} from "rc-slider-captcha"

import { useI18n } from "@/providers/i18n-provider"
import { captchaApi } from "@/stores/system-api"

const CONTROL_BUTTON_WIDTH = 40
const INDICATOR_BORDER_WIDTH = 2
const FALLBACK_WIDTH = 360

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })

    observer.observe(element)
    setWidth(element.getBoundingClientRect().width)

    return () => {
      observer.disconnect()
    }
  }, [])

  return { ref, width }
}

interface CaptchaSliderProps {
  account: string
  onVerifySuccess: (data: VerifyParam) => Promise<void> | void
  onVerifyError?: () => void
}

export default function CaptchaSlider({
  account,
  onVerifySuccess,
  onVerifyError,
}: CaptchaSliderProps) {
  const { t } = useI18n()
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const actionRef = useRef<ActionType | undefined>(undefined)
  const [verifyData, setVerifyData] = useState<VerifyParam | null>(null)

  const sliderWidth = width || FALLBACK_WIDTH

  useEffect(() => {
    if (actionRef.current?.status === Status.Success) {
      actionRef.current.refresh()
    }
  }, [sliderWidth])

  const verifyMutation = useMutation({
    mutationFn: (params: { account: string; code: string }) =>
      captchaApi.getSlider(params),
    onSuccess: async () => {
      if (verifyData) {
        await onVerifySuccess(verifyData)
      }
    },
    onError: () => {
      onVerifyError?.()
      actionRef.current?.refresh()
    },
  })

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
      <div ref={ref}>
        <SliderCaptcha
          mode="slider"
          tipText={{
            default: t("auth.captcha.tip.default"),
            moving: t("auth.captcha.tip.moving"),
            error: t("auth.captcha.tip.error"),
            success: t("auth.captcha.tip.success"),
          }}
          errorHoldDuration={1000}
          bgSize={{ width: sliderWidth }}
          puzzleSize={{
            left: INDICATOR_BORDER_WIDTH,
            width: CONTROL_BUTTON_WIDTH,
          }}
          actionRef={actionRef}
          onVerify={(data: VerifyParam) => {
            const expectedPosition =
              sliderWidth - CONTROL_BUTTON_WIDTH - INDICATOR_BORDER_WIDTH

            if (data.x !== expectedPosition) {
              onVerifyError?.()
              return Promise.reject()
            }

            setVerifyData(data)
            verifyMutation.mutate({
              account,
              code: JSON.stringify(data),
            })

            return Promise.resolve()
          }}
        />
      </div>
    </div>
  )
}
