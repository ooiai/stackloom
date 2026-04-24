import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { post } from "@/lib/http/axios"
import type { SliderCaptcha } from "@/types/system.types"

const BASIC_AUTH_HEADER = {
  Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
}

export const captchaApi = {
  getSlider: async (params: SliderCaptcha) => {
    return post("/apiv1/sys/captcha/slider", params, {
      headers: BASIC_AUTH_HEADER,
    })
  },
}
