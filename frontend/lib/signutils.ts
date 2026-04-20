/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
import CryptoJS from "crypto-js"

const singletonEnforcer = Symbol("SignUtils")
class SignUtils {
  private static _instance: SignUtils

  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer)
      throw new Error("Cannot initialize single instance")
  }

  static get instance() {
    this._instance || (this._instance = new SignUtils(singletonEnforcer))
    return this._instance
  }

  /**
   * @description Generate signature
   * @param timestamp - the timestamp
   * @param method - the request method
   * @param uri - the request path
   * @param body - the request body
   * @param params - the request parameters
   * @param secretKey - the secret key
   * @returns the signature
   */
  gen = (
    timestamp: number,
    method: string,
    uri: string,
    body: string = "",
    params: Record<string, any> = {},
    secretKey: string
  ): string => {
    // Sort query parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
      )
      .join("&")
    const data = `${timestamp}${method}${uri}${body}${sortedParams}`
    return CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Hex)
  }
}

export default SignUtils.instance
