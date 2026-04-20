/* eslint-disable @typescript-eslint/no-explicit-any */

import { aesDecode, aesEncode, md5Encode, useAes, useMD5 } from "./use-crypto"

const isBrowser = () => typeof window !== "undefined"

const PRIVATEKEY = "PGweQYObtK4+uK8H"

function usePersistedState<T>(key: string) {
  const { encode, decode } = useAes(PRIVATEKEY)
  const md5 = useMD5()

  /**
   * 设置
   * @param value 值
   * @param expire 毫秒
   */
  const setItem = (value: T, expire: number = 0) => {
    if (!isBrowser()) return
    const data = {
      time: Date.now(),
      data: value,
      expire: expire,
    }
    window.localStorage.setItem(md5.encode(key), encode(JSON.stringify(data)))
  }

  const getItem = () => {
    if (!isBrowser()) return null
    const data = window.localStorage.getItem(md5.encode(key))
    return data ? (JSON.parse(decode(data)).data as T) : null
  }

  const expire = (shift: number = 0) => {
    if (!isBrowser()) return false
    const data = window.localStorage.getItem(md5.encode(key))
    if (data) {
      const decodeData = JSON.parse(decode(data))
      const nowData = Date.now()
      const time = parseInt(decodeData.time)
      const expire = parseInt(decodeData.expire)
      return nowData >= time + expire + shift ? true : false
    }
    return false
  }

  const clear = () => {
    if (!isBrowser()) return
    window.localStorage.removeItem(md5.encode(key))
  }

  return { setItem, getItem, clear, expire }
}

const getStorageItem = (key: string) => {
  if (!isBrowser()) return null
  const data = window.localStorage.getItem(md5Encode(key))
  return data ? JSON.parse(aesDecode(PRIVATEKEY, data)).data : null
}

const setStorageItem = (key: string, value: any, expire: number = 0) => {
  if (!isBrowser()) return
  const data = {
    time: Date.now(),
    data: value,
    expire: expire,
  }
  window.localStorage.setItem(
    md5Encode(key),
    aesEncode(PRIVATEKEY, JSON.stringify(data))
  )
}

const removeStorageItem = (key: string) => {
  if (!isBrowser()) return
  window.localStorage.removeItem(md5Encode(key))
}

export { getStorageItem, removeStorageItem, setStorageItem, usePersistedState }
