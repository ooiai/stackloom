import CryptoJS from "crypto-js"
import { ethers } from "ethers"
import Hashids from "hashids"

const hashids = new Hashids("your-salt", 8)

const PRIVATEKEY = "PGweQYObtK4+uK8H"

export const useCrypto = () => {
  // AES 加密
  const aesEncrypt = (data: string, key: string) => {
    return CryptoJS.AES.encrypt(data, key).toString()
  }

  // AES 解密
  const aesDecrypt = (encryptedData: string, key: string) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // AES 加密
  const aesEnc = (data: string) => {
    return CryptoJS.AES.encrypt(data, PRIVATEKEY).toString()
  }

  // AES 解密
  const aesDec = (encryptedData: string) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, PRIVATEKEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // 生成消息哈希
  const createMessageHash = (message: string) => {
    return ethers.hashMessage(message)
  }

  // 签名消息
  const signMessage = async (message: string, signer: ethers.Signer) => {
    return await signer.signMessage(message)
  }

  // 验证签名
  const verifySignature = (
    message: string,
    signature: string,
    expectedSigner: string
  ) => {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase()
  }

  // SHA256 哈希
  const sha256Hash = (data: string) => {
    return CryptoJS.SHA256(data).toString()
  }

  // HMAC
  const createHmac = (data: string, key: string) => {
    return CryptoJS.HmacSHA256(data, key).toString()
  }

  // MD5 哈希
  const md5Hash = (data: string) => {
    return CryptoJS.MD5(data).toString()
  }

  // HashID 编码
  const encodeHashId = (number: number) => {
    return hashids.encode(number)
  }

  const decodeHashId = (hash: string) => {
    return hashids.decode(hash)
  }

  // Base64 编码
  const base64Encode = (data: string) => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data))
  }

  // Base64 解码
  const base64Decode = (encodedData: string) => {
    return CryptoJS.enc.Base64.parse(encodedData).toString(CryptoJS.enc.Utf8)
  }

  // SHA3 (Keccak256) 哈希
  const sha3Hash = (data: string) => {
    return CryptoJS.SHA3(data, { outputLength: 256 }).toString()
  }

  // RIPEMD160 哈希
  const ripemd160Hash = (data: string) => {
    return CryptoJS.RIPEMD160(data).toString()
  }

  // Bcrypt 密码哈希（需要额外安装 bcryptjs）
  const bcryptHash = async (password: string, saltRounds: number = 10) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require("bcryptjs")
    return await bcrypt.hash(password, saltRounds)
  }

  // 生成随机盐值
  const generateSalt = (length: number = 16) => {
    return CryptoJS.lib.WordArray.random(length).toString()
  }

  return {
    aesEncrypt,
    aesDecrypt,
    createMessageHash,
    signMessage,
    verifySignature,
    sha256Hash,
    createHmac,
    md5Hash,
    encodeHashId,
    decodeHashId,
    base64Encode,
    base64Decode,
    sha3Hash,
    ripemd160Hash,
    bcryptHash,
    generateSalt,
    aesEnc,
    aesDec,
  }
}

// aes
const useAes = (privateKey: string) => {
  const encode = (content: string) => {
    const key = CryptoJS.enc.Utf8.parse(privateKey)
    const message = CryptoJS.enc.Utf8.parse(content)
    const encrypted = CryptoJS.AES.encrypt(message, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.toString()
  }

  const decode = (cipherMessage: string) => {
    const key = CryptoJS.enc.Utf8.parse(privateKey)
    const decrypt = CryptoJS.AES.decrypt(cipherMessage, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    return CryptoJS.enc.Utf8.stringify(decrypt).toString()
  }

  return { encode, decode }
}

const aesEncode = (privateKey: string, content: string) => {
  const key = CryptoJS.enc.Utf8.parse(privateKey)
  const message = CryptoJS.enc.Utf8.parse(content)
  const encrypted = CryptoJS.AES.encrypt(message, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

const aesDecode = (privateKey: string, cipherMessage: string) => {
  const key = CryptoJS.enc.Utf8.parse(privateKey)
  const decrypt = CryptoJS.AES.decrypt(cipherMessage, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return CryptoJS.enc.Utf8.stringify(decrypt).toString()
}

// md5
const useMD5 = () => {
  const encode = (content: string) => {
    return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(content)).toString()
  }
  return { encode }
}

const md5Encode = (content: string) => {
  return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(content)).toString()
}

// base64
const useBase64 = () => {
  const decode = (content: string) => {
    return CryptoJS.enc.Base64.parse(content).toString(CryptoJS.enc.Utf8)
  }
  const encode = (content: string) => {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(content))
  }
  return { encode, decode }
}

// sha1
const useSHA1 = () => {
  const encode = (content: string) => {
    return CryptoJS.SHA1(content).toString()
  }
  return { encode }
}

export { aesDecode, aesEncode, md5Encode, useAes, useBase64, useMD5, useSHA1 }
