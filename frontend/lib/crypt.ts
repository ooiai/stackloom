/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CryptoJS from "crypto-js"

import { deflate, inflate } from "pako"

const PRIVATEKEY = "PGweQYObtK4+uK8H"

const singletonEnforcer = Symbol("CryptUtil")

class CryptUtil {
  private static _instance: CryptUtil
  constructor(enforcer: any) {
    if (enforcer !== singletonEnforcer)
      throw new Error("CryptUtil Cannot initialize single instance")
  }

  static get instance() {
    this._instance || (this._instance = new CryptUtil(singletonEnforcer))
    return this._instance
  }

  // Use Double Encoding with CryptoJS
  encodeBase64Double = (str: string): string => {
    const encodedStr = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(str)
    )
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encodedStr))
  }

  // Decode base64 double encoded string
  decodeBase64Double = (encodedStr: string): string => {
    const decodedStr = CryptoJS.enc.Base64.parse(encodedStr).toString(
      CryptoJS.enc.Utf8
    )
    return CryptoJS.enc.Base64.parse(decodedStr).toString(CryptoJS.enc.Utf8)
  }

  // Use Base64 encoding with CryptoJS
  encodeBase64 = (str: string): string => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
  }

  // Decode base64 encoded string
  decodeBase64 = (encodedStr: string): string => {
    return CryptoJS.enc.Base64.parse(encodedStr).toString(CryptoJS.enc.Utf8)
  }

  // Decode base64 encoded string
  decryptAES = (key: string, data: any) => {
    const keyHex = CryptoJS.enc.Hex.parse(key)
    const decrypted = CryptoJS.AES.decrypt(data, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    return decrypted.toString(CryptoJS.enc.Utf8)
  }

  // Compress data
  compressData = (data: any) => {
    return deflate(data)
  }

  // Decompress data
  decompressData = (data: any) => {
    return inflate(data, { to: "string" })
  }

  binaryStringToUint8Array = (binaryString: string): Uint8Array => {
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  // Decompress and decrypt data
  decompressDecryptData = (data: any) => {
    // console.log("data", data);
    // Get compressed data
    const compressed = new Uint8Array(data)
    // console.log("compressed", compressed);
    // Decompress data
    const decompressed = inflate(compressed, { to: "string" })
    // console.log("decompressed", decompressed);
    // Use separator to parse out key, IV, and encrypted data
    const [keyHex, ivHex, encryptedHex] = decompressed.split(":") as [
      string,
      string,
      string,
    ]
    // Convert hexadecimal string to byte array
    const encryptedBytes = CryptoJS.enc.Hex.parse(encryptedHex)
    // Create AES decryption object
    const key = CryptoJS.enc.Hex.parse(keyHex)
    const iv = CryptoJS.enc.Hex.parse(ivHex)
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedBytes } as any,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    )
    // Convert decrypted data to UTF-8 string
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)
    return decryptedText
  }

  // Generate key and IV
  generateKeyAndIv = (token: string) => {
    const hash = CryptoJS.SHA256(token)
    const key = CryptoJS.enc.Hex.parse(
      hash.toString(CryptoJS.enc.Hex).slice(0, 32)
    ) // Take first 16 bytes (32 characters) as key
    const iv = CryptoJS.enc.Hex.parse(
      hash.toString(CryptoJS.enc.Hex).slice(32, 64)
    ) // Take last 16 bytes (32 characters) as iv
    return { key, iv }
  }

  // Encrypt and compress data
  encryptCompressData = (data: any, token: string) => {
    // Convert data to string
    const dataString = JSON.stringify(data)
    // Generate AES key and IV based on token
    const { key, iv } = this.generateKeyAndIv(token)
    // Use AES to encrypt data
    const encrypted = CryptoJS.AES.encrypt(dataString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    // Convert key, IV, and encrypted data to hexadecimal strings
    const keyHex = key.toString(CryptoJS.enc.Hex)
    const ivHex = iv.toString(CryptoJS.enc.Hex)
    const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    // Concatenate key, IV, and encrypted data with a separator
    const combined = `${keyHex}:${ivHex}:${encryptedHex}`
    // Compress concatenated string
    const compressed = deflate(combined)
    return compressed
  }

  // Encrypt AES data to hexadecimal string
  encryptAESToHex = (data: any, key: string) => {
    const dataString = JSON.stringify(data)
    const keyHex = CryptoJS.enc.Hex.parse(key)
    const encrypted = CryptoJS.AES.encrypt(dataString, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex)
  }

  // Use MD5 to encrypt data
  md5 = (data: any) => {
    return CryptoJS.MD5(data).toString()
  }

  // Bcrypt Hashing with dynamic import to avoid `require()` and satisfy ESM/linters
  md5Double = (password: string) => {
    const first = CryptoJS.MD5(password).toString()
    return CryptoJS.MD5(first).toString()
  }

  // AES encryption
  aesEnc = (data: string) => {
    return CryptoJS.AES.encrypt(data, PRIVATEKEY).toString()
  }

  // AES decryption
  aesDec = (encryptedData: string) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, PRIVATEKEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
}

export default CryptUtil.instance
