/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import CryptUtil from "./crypt"

interface DeviceInfo {
  userAgent: string
  platform: string
  deviceMemory: string
  hardwareConcurrency: string | number
  language: string
  screenWidth: number
  screenHeight: number
  availWidth: number
  availHeight: number
  colorDepth: number
  pixelDepth: number
  appName: string
  appVersion: string
  appCodeName: string
  product: string
  productSub: string
}

const singletonEnforcer = Symbol("DeviceUtils")
class DeviceUtils {
  private static _instance: DeviceUtils

  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer)
      throw new Error("Cannot initialize single instance")
  }

  static get instance() {
    this._instance || (this._instance = new DeviceUtils(singletonEnforcer))
    return this._instance
  }

  // Get device information
  getWebInfo = (): DeviceInfo => {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string }
    }

    let platform = "Unknown"
    if (nav.userAgentData && nav.userAgentData.platform) {
      platform = nav.userAgentData.platform
    } else if (navigator.platform) {
      platform = navigator.platform
    }

    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent || "Unknown",
      platform,
      deviceMemory:
        "deviceMemory" in navigator
          ? `${navigator.deviceMemory} GB`
          : "Unknown",
      hardwareConcurrency:
        "hardwareConcurrency" in navigator
          ? navigator.hardwareConcurrency
          : "Unknown",
      language:
        navigator.language || (navigator as any).userLanguage || "Unknown",
      screenWidth: window.screen.width || 0,
      screenHeight: window.screen.height || 0,
      availWidth: window.screen.availWidth || 0,
      availHeight: window.screen.availHeight || 0,
      colorDepth: window.screen.colorDepth || 0,
      pixelDepth: window.screen.pixelDepth || 0,
      appName: navigator.appName || "Unknown",
      appVersion: navigator.appVersion || "Unknown",
      appCodeName: navigator.appCodeName || "Unknown",
      product: navigator.product || "Unknown",
      productSub: navigator.productSub || "Unknown",
    }
    return deviceInfo
  }

  //
  // The getDeviceInfo method is used to retrieve device information and encrypt it using AES encryption.
  //
  getDeviceInfo = (aesKey: string) => {
    const deviceInfo: any = this.getWebInfo()
    deviceInfo.ts = Math.floor(Date.now() / 1000 / 60)
    const encodeDeviceInfo = CryptUtil.encryptAESToHex(aesKey, deviceInfo)
    delete deviceInfo.ts
    return { deviceInfo, encodeDeviceInfo }
  }
}

export default DeviceUtils.instance
