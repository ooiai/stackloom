import fp2 from "@fingerprintjs/fingerprintjs"
import { STORAGE_ENUM } from "@/lib/config/enums"
import { getStorageItem, setStorageItem } from "@/hooks/use-persisted-state"
import CryptoJS from "crypto-js"

/* eslint-disable @typescript-eslint/no-explicit-any */
export const fileChecksum = (file: File): Promise<string> => {
  // console.log("uploading file to s3:", file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    // Use readAsArrayBuffer instead of readAsBinaryString
    reader.readAsArrayBuffer(file)

    reader.onloadend = (e) => {
      if (!e.target || !e.target.result) {
        reject(new Error("Failed to read file"))
        return
      }

      // Convert ArrayBuffer to a format CryptoJS can process
      const arrayBuffer = e.target.result as ArrayBuffer
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)

      // Calculate MD5 hash
      const result = CryptoJS.MD5(wordArray)
      resolve(result.toString())
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }
  })
}

/**
 * 获取名字简称
 * 中文名：取第一个汉字
 * 英文名：取第一个大写字母
 * 例：王普 => 王，黄大仙 => 黄，LinkZend => L
 */
export function getNameAbbr(name: string): string {
  if (!name) return ""

  const zhReg = /[\u4e00-\u9fa5]/
  const enReg = /[a-zA-Z]/

  const firstChar = name[0] || ""
  if (zhReg.test(firstChar)) {
    return firstChar
  } else if (enReg.test(firstChar)) {
    return firstChar.toUpperCase()
  }
  return ""
}

/**
 * 返回一个新的 params 数组，更新了 path 字段
 * @param data 文件路径数组
 * @param params 包含 checksum 字段的对象数组
 * @returns 新的 params 数组
 */
// export function updatePathReturnNew(data: string[], params: any[]): any[] {
//   // 建立 checksum 到 data 路径的映射
//   const checksumToPath: Record<string, string> = {};
//   data.forEach((item) => {
//     const match = item.match(/\/([a-f0-9]{32})\./);
//     if (match) {
//       checksumToPath[match[1]] = item;
//     }
//   });

//   // 返回新的数组，更新 path 字段
//   return params.map((param) => ({
//     ...param,
//     path: checksumToPath[param.checksum] || param.path,
//   }));
// }
export function updatePathReturnNew(
  data: string[],
  params: { checksum?: string; path: string; [k: string]: any }[]
): any[] {
  const lowerData = data.map((d) => ({ raw: d, lower: d.toLowerCase() }))

  return params.map((p) => {
    const key = String(p.checksum || "").toLowerCase()
    const match = key ? lowerData.find((d) => d.lower.includes(key)) : null

    return {
      ...p,
      path: match ? match.raw : p.path,
    }
  })
}

/**
 * 计算字符串的字符数
 * @param str 字符串
 * @returns 字符数
 */
export function countChars(str: string): number {
  return Array.from(str).length
}

export function ensureArray<T>(val: T | T[] | null | undefined): T[] {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined) return []
  return [val]
}

export function getFingerprint() {
  const storeFP: string = getStorageItem(STORAGE_ENUM.FP)
  if (!storeFP) {
    fp2
      .load()
      .then((fp) => fp.get())
      .then((result) => {
        const visitorId = result.visitorId
        setStorageItem(STORAGE_ENUM.FP, visitorId)

        return visitorId
      })
      .catch((error) => {
        console.error("Failed to get fingerprint:", error)
      })
  }
  return storeFP
}
