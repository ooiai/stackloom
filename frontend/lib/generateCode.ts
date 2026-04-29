import { pinyin } from "pinyin-pro"

export type GenerateCodeOptions = {
  // 输出分隔符，'' 表示无分隔符
  delimiter?: "-" | "_" | ""
  // 大小写
  case?: "lower" | "upper"
  // 最长长度（包含哈希/唯一性后缀）
  maxLength?: number
  // 编码策略：auto（包含中文则用拼音，否则 ASCII）、pinyin（强制中文转拼音）、ascii（强制 ASCII 规则）
  strategy?: "auto" | "pinyin" | "ascii"
  // 是否追加稳定短哈希；true 表示默认长度 6，也可传数字指定长度
  appendHash?: boolean | number
  // 提供一个“唯一性来源”，用于稳定去重（如数据库 ID、时间戳、UUID、函数返回值等）
  ensureUniqueWith?: string | number | Date | (() => string)
  // 是否在开头加入由各词首字母组成的缩写（基于拼音或 ASCII 分词）
  addInitialsPrefix?: boolean
  // 在结尾追加纯数字随机后缀的长度；0 或未设置则不追加
  appendRandomDigits?: number
}

const DEFAULTS: Required<
  Pick<GenerateCodeOptions, "delimiter" | "case" | "maxLength" | "strategy">
> = {
  delimiter: "-",
  case: "lower",
  maxLength: 64,
  strategy: "auto",
}

const CJK_REGEX = /[\u4e00-\u9fff]/ // 基本中文字符范围

/**
 * FNV-1a 32-bit 哈希，浏览器/Node 通用，速度快且实现简单
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = (hash >>> 0) * 0x01000193 // 乘以 FNV 质数
  }
  return hash >>> 0
}

/**
 * 将哈希数值转为 base36，并截取指定长度
 */
function shortHash(input: string, length = 6): string {
  const h = fnv1a32(input).toString(36)
  // base36 可能不足 length，就重复拼接后再截取
  const repeated = (h + h).slice(0, Math.max(length, h.length))
  return repeated.slice(0, length)
}

/**
 * 生成指定长度的纯数字随机串
 */
function randomDigits(length: number): string {
  const n = Math.max(1, Math.min(16, Math.floor(length)))
  let out = ""
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString()
  return out
}

/**
 * 归一化为 ASCII：去音标、转空白为分隔符、剔除非字母数字的字符
 */
function normalizeAscii(input: string, delimiter: string): string {
  const noDiacritics = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const replaced = noDiacritics.replace(/[^a-zA-Z0-9]+/g, delimiter)
  // 折叠重复分隔符并修剪
  const deduped = replaced.replace(
    new RegExp(`${escapeRegExp(delimiter)}{2,}`, "g"),
    delimiter
  )
  return trimDelimiter(deduped, delimiter)
}

/**
 * 中文转拼音（无声调），非中文字符保持原样；再统一做 ASCII 归一化
 */
function toPinyinAscii(input: string, delimiter: string): string {
  // pinyin-pro: type: 'array' 可以拿到分词后的数组（中文转拼音，非中文原样）
  const arr = pinyin(input, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
  })
  const joined = arr.join(" ")
  return normalizeAscii(joined, delimiter)
}

function containsCJK(input: string): boolean {
  return CJK_REGEX.test(input)
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function trimDelimiter(input: string, delimiter: string): string {
  if (!delimiter) return input
  const d = escapeRegExp(delimiter)
  return input.replace(new RegExp(`^${d}+|${d}+$`, "g"), "")
}

/**
 * 根据 maxLength、安全地截断主体并保留后缀（如哈希/唯一性）空间
 */
function safeTruncate(
  base: string,
  maxLength: number,
  suffix: string,
  delimiter: string
): string {
  if (!maxLength || maxLength <= 0) return base + suffix

  const sep = suffix ? delimiter : ""
  const reserved = suffix ? sep.length + suffix.length : 0

  if (base.length + reserved <= maxLength) {
    return base + sep + suffix
  }

  // 需要截断主体
  const allowed = Math.max(0, maxLength - reserved)
  let truncated = base.slice(0, allowed)

  // 如果有分隔符，尽量不要以分隔符结尾
  if (delimiter && truncated.endsWith(delimiter)) {
    truncated = truncated.replace(
      new RegExp(`${escapeRegExp(delimiter)}+$`),
      ""
    )
  }

  // 如果截断到 0 了，退而求其次直接用后缀
  if (!truncated) return suffix ? suffix.slice(0, maxLength) : ""

  return suffix ? `${truncated}${sep}${suffix}` : truncated
}

/**
 * 生成编码
 */
export function generateCode(
  name: string,
  options: GenerateCodeOptions = {}
): string {
  const delimiter = options.delimiter ?? DEFAULTS.delimiter
  const outCase = options.case ?? DEFAULTS.case
  const maxLength = options.maxLength ?? DEFAULTS.maxLength
  const strategy = options.strategy ?? DEFAULTS.strategy

  if (!name || !name.trim()) {
    const fallback = "code"
    const hs = options.appendHash
      ? shortHash(String(Date.now()), getHashLen(options.appendHash))
      : ""
    return safeTruncate(fallback, maxLength, hs, delimiter)
  }

  const raw = name.trim()

  // 1) 先根据策略得到基础主体
  let base: string
  if (strategy === "pinyin" || (strategy === "auto" && containsCJK(raw))) {
    base = toPinyinAscii(raw, delimiter)
  } else {
    base = normalizeAscii(raw, delimiter)
  }

  // 2) 决定大小写
  if (outCase === "lower") base = base.toLowerCase()
  else if (outCase === "upper") base = base.toUpperCase()

  // 如果清洗后为空，给个兜底
  if (!base) base = "code"

  // 2.5) 可选：首字母前缀（基于分词得到的首字母缩写）
  let body = base
  if (options.addInitialsPrefix) {
    const tokenized =
      strategy === "pinyin" || (strategy === "auto" && containsCJK(raw))
        ? toPinyinAscii(raw, "-")
        : normalizeAscii(raw, "-")
    const initialsRaw = tokenized
      .split("-")
      .filter(Boolean)
      .map((t) => t[0])
      .join("")
    if (initialsRaw) {
      const initialsCased =
        outCase === "upper"
          ? initialsRaw.toUpperCase()
          : initialsRaw.toLowerCase()
      const joiner = delimiter ? delimiter : ""
      body = initialsCased + (body ? joiner + body : "")
    }
  }

  // 3) 生成后缀（唯一性来源 + 额外哈希 + 随机数字）
  const suffixParts: string[] = []

  if (options.ensureUniqueWith !== undefined) {
    const uniqVal =
      typeof options.ensureUniqueWith === "function"
        ? String(options.ensureUniqueWith())
        : String(
            options.ensureUniqueWith instanceof Date
              ? options.ensureUniqueWith.getTime()
              : options.ensureUniqueWith
          )

    suffixParts.push(shortHash(`${raw}|${uniqVal}`, 6))
  }

  if (options.appendHash) {
    suffixParts.push(shortHash(raw, getHashLen(options.appendHash)))
  }

  if (
    typeof options.appendRandomDigits === "number" &&
    options.appendRandomDigits > 0
  ) {
    suffixParts.push(randomDigits(options.appendRandomDigits))
  }

  const suffix = suffixParts.join("")

  // 4) 截断以满足最大长度
  const finalCode = safeTruncate(body, maxLength, suffix, delimiter)

  return finalCode
}

function getHashLen(appendHash: boolean | number): number {
  if (appendHash === true) return 6
  if (typeof appendHash === "number")
    return Math.max(3, Math.min(16, Math.floor(appendHash)))
  return 0
}

/**
 * 生成短租户编码，如：shdezx-3f8a
 */
export function generateTenantCode(name: string): string {
  const raw = name.trim()
  if (!raw) {
    return `code-${shortHash(String(Date.now()), 4)}`
  }

  const tokenized = containsCJK(raw)
    ? toPinyinAscii(raw, "-")
    : normalizeAscii(raw, "-")

  const initials = tokenized
    .split("-")
    .filter(Boolean)
    .map((token) => token[0])
    .join("")
    .toLowerCase()

  const body = initials || "code"
  const suffix = shortHash(raw, 4)

  return `${body}-${suffix}`
}

// ----------------------
// 简单用例（可删除）
// ----------------------
// console.log(generateCode('苹果 iPhone 15 Pro Max')); // pingguo-iphone-15-pro-max
// console.log(generateCode('测试', { appendHash: true })); // ceshi-xxxxx
// console.log(generateCode('Crème Brûlée', { delimiter: '_', case: 'lower' })); // creme_brulee
// console.log(generateCode('华为Mate60 Pro+', { maxLength: 20, appendHash: 5 })); // huawei-mate60-xxxxx
// const code = generateCode("上海第二中学", {
//   delimiter: "-",
//   case: "lower",
//   maxLength: 32,
//   strategy: "auto",
//   addInitialsPrefix: true,     // 添加首字母缩写前缀
//   appendRandomDigits: 4,       // 结尾添加 4 位随机数
//   // appendHash: true,         // 如需稳定哈希也可继续开启
//   // ensureUniqueWith: 12345,  // 提供唯一性来源（可选）
// });
