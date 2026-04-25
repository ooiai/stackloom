import { HTTP_REQUEST_ENUM } from "@/lib/config/enums"
import CryptUtil from "@/lib/crypt"
import { post } from "@/lib/http/axios"
import {
  AwsSignUrlReq,
  AwsSignUrlResp,
  AwsUploadRemoteImageReq,
  AwsUploadRemoteImageResp,
  AwsUploadRemoteObjectReq,
  AwsUploadRemoteObjectResp,
  AwsSts,
  AwsStsResp,
  SliderCaptcha,
  SmsSignin,
} from "@/types/system.types"

/// System Captcha API
export const captchaApi = {
  /// Get slider captcha
  getSlider: async (params: SliderCaptcha) => {
    return post("/apiv1/sys/captcha/slider", params, {
      headers: {
        Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
      },
    })
  },
}

/// System AWS API
export const awsApi = {
  /// Get AWS STS credentials
  getSts: async (params: AwsSts): Promise<AwsStsResp> => {
    return post("/apiv1/sys/aws/sts", params)
  },
  getSignedUrl: async (params: AwsSignUrlReq): Promise<AwsSignUrlResp> => {
    return post("/apiv1/sys/aws/sign_url", params)
  },
  uploadRemoteImage: async (
    params: AwsUploadRemoteImageReq
  ): Promise<AwsUploadRemoteImageResp> => {
    return post("/apiv1/sys/aws/upload_remote_image", params)
  },
  uploadRemoteObject: async (
    params: AwsUploadRemoteObjectReq
  ): Promise<AwsUploadRemoteObjectResp> => {
    return post("/apiv1/sys/aws/upload_remote_object", params)
  },
}

/// System SMS API
export const smsApi = {
  sendSignin: async (params: SmsSignin) => {
    return post("/apiv1/sys/sms/signin", params, {
      headers: {
        Authorization: `Basic ${CryptUtil.encodeBase64Double(HTTP_REQUEST_ENUM.BASIC_AUTH)}`,
      },
    })
  },
}
