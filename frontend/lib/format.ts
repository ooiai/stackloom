/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

/*
* Formats a number with comma separators.
 formatNumber(1234567) will return '1,234,567'
 formatNumber(1234567.89) will return '1,234,567.89'
*/
export const formatNumber = (num: number | string) => {
  if (!num) return num
  const parts: any[] = num.toString().split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

export const formatFileSize = (num: number) => {
  if (!num) return num
  const units = ["", "K", "M", "G", "T", "P"]
  let index = 0
  while (num >= 1024 && index < units.length) {
    num = num / 1024
    index++
  }
  return `${num.toFixed(2)}${units[index]}B`
}

export const formatTime = (num: number) => {
  if (!num) return num
  const units = ["sec", "min", "h"]
  let index = 0
  while (num >= 60 && index < units.length) {
    num = num / 60
    index++
  }
  return `${num.toFixed(2)} ${units[index]}`
}

/**
const str = "第{}页,共{}页";
const result = formatString(str, "{}", 1, 10);
*/
export const formatString = (
  str: string,
  placeholder: string,
  ...args: any
) => {
  return args.reduce(
    (result: any, arg: any) => result.replace(placeholder, arg),
    str
  )
}
