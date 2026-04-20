import { spawn } from "node:child_process"
import { constants } from "node:fs"
import { access, mkdir, stat } from "node:fs/promises"
import { dirname, extname, join, parse, resolve } from "node:path"

export type GhostscriptPdfPreset =
  | "screen"
  | "ebook"
  | "printer"
  | "prepress"
  | "default"

export type GhostscriptImageDevice = "jpeg" | "png16m" | "pngalpha"
export type GhostscriptCompressKind = "pdf" | "image" | "auto"

export type GhostscriptCommandOptions = {
  gsPath?: string
  timeoutMs?: number
  cwd?: string
}

export type GhostscriptCompressionStats = {
  inputBytes: number
  outputBytes: number
  savingsBytes: number
  savingsRatio: number
  savingsPercent: number
}

export type GhostscriptCompressionResult = GhostscriptCompressionStats & {
  outputPath: string
}

export type CompressPdfWithGhostscriptOptions = GhostscriptCommandOptions & {
  inputPath: string
  outputPath?: string
  preset?: GhostscriptPdfPreset
  compatibilityLevel?: "1.3" | "1.4" | "1.5" | "1.6" | "1.7"
  dpi?: number
}

export type CompressImageWithGhostscriptOptions = GhostscriptCommandOptions & {
  inputPath: string
  outputPath?: string
  device?: GhostscriptImageDevice
  quality?: number
  dpi?: number
}

export type CompressWithGhostscriptOptions = GhostscriptCommandOptions & {
  inputPath: string
  outputPath?: string
  kind?: GhostscriptCompressKind
  pdf?: {
    preset?: GhostscriptPdfPreset
    compatibilityLevel?: "1.3" | "1.4" | "1.5" | "1.6" | "1.7"
    dpi?: number
  }
  image?: {
    device?: GhostscriptImageDevice
    quality?: number
    dpi?: number
  }
}

const DEFAULT_GS_PATH = "gs"
const DEFAULT_TIMEOUT_MS = 120_000
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
])

function normalizePath(path: string) {
  return resolve(path)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildDefaultOutputPath(inputPath: string, suffix: string) {
  const parsed = parse(inputPath)
  return join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`)
}

function validateDpi(dpi?: number) {
  if (dpi == null) return undefined
  const intDpi = Math.round(dpi)
  if (intDpi < 36 || intDpi > 1200) {
    throw new Error("dpi must be between 36 and 1200")
  }
  return intDpi
}

async function ensureReadableFile(path: string) {
  await access(path, constants.R_OK)
}

async function ensureOutputDirectory(path: string) {
  await mkdir(dirname(path), { recursive: true })
}

function createStats(inputBytes: number, outputBytes: number) {
  const savingsBytes = inputBytes - outputBytes
  const savingsRatio = inputBytes > 0 ? outputBytes / inputBytes : 1
  const savingsPercent = inputBytes > 0 ? (savingsBytes / inputBytes) * 100 : 0

  return {
    inputBytes,
    outputBytes,
    savingsBytes,
    savingsRatio,
    savingsPercent,
  }
}

function resolveImageDevice(
  outputPath: string,
  device?: GhostscriptImageDevice
): GhostscriptImageDevice {
  if (device) return device

  const ext = extname(outputPath).toLowerCase()
  if (ext === ".png") return "png16m"
  if (ext === ".jpg" || ext === ".jpeg") return "jpeg"

  throw new Error(
    "Unable to infer Ghostscript image device from output file extension. Use .jpg/.jpeg/.png or set device explicitly."
  )
}

function inferKindByPath(
  inputPath: string
): Exclude<GhostscriptCompressKind, "auto"> {
  const ext = extname(inputPath).toLowerCase()
  if (ext === ".pdf") return "pdf"
  if (IMAGE_EXTENSIONS.has(ext)) return "image"

  throw new Error(
    "Unable to infer compression kind from input extension. Set kind to 'pdf' or 'image' explicitly."
  )
}

function runGhostscript(
  args: string[],
  options: GhostscriptCommandOptions = {}
) {
  const gsPath = options.gsPath || DEFAULT_GS_PATH
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return new Promise<{ stdout: string; stderr: string }>(
    (resolvePromise, rejectPromise) => {
      const child = spawn(gsPath, args, {
        cwd: options.cwd,
        stdio: ["ignore", "pipe", "pipe"],
      })

      let done = false
      let stdout = ""
      let stderr = ""

      const finish = (
        cb: (value?: { stdout: string; stderr: string } | Error) => void,
        value?: { stdout: string; stderr: string } | Error
      ) => {
        if (done) return
        done = true
        cb(value)
      }

      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              child.kill("SIGKILL")
              finish(
                (error) => rejectPromise(error as Error),
                new Error(`Ghostscript timed out after ${timeoutMs}ms`)
              )
            }, timeoutMs)
          : null

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString()
      })

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString()
      })

      child.on("error", (error) => {
        if (timer) clearTimeout(timer)
        finish((err) => rejectPromise(err as Error), error)
      })

      child.on("close", (code) => {
        if (timer) clearTimeout(timer)
        if (code === 0) {
          finish(
            (value) =>
              resolvePromise(value as { stdout: string; stderr: string }),
            {
              stdout,
              stderr,
            }
          )
          return
        }

        const details = [stderr.trim(), stdout.trim()]
          .filter(Boolean)
          .join("\n")
        const message = details
          ? `Ghostscript exited with code ${code}: ${details}`
          : `Ghostscript exited with code ${code}`
        finish((error) => rejectPromise(error as Error), new Error(message))
      })
    }
  )
}

export async function ensureGhostscriptAvailable(
  options: GhostscriptCommandOptions = {}
) {
  const { stdout, stderr } = await runGhostscript(["--version"], options)
  const version = stdout.trim() || stderr.trim()
  return {
    available: true,
    version,
  }
}

export async function compressPdfWithGhostscript(
  options: CompressPdfWithGhostscriptOptions
): Promise<GhostscriptCompressionResult> {
  const inputPath = normalizePath(options.inputPath)
  const outputPath = normalizePath(
    options.outputPath || buildDefaultOutputPath(inputPath, ".compressed")
  )

  const preset = options.preset || "ebook"
  const compatibilityLevel = options.compatibilityLevel || "1.4"
  const dpi = validateDpi(options.dpi)

  await ensureReadableFile(inputPath)
  await ensureOutputDirectory(outputPath)

  const args = [
    "-sDEVICE=pdfwrite",
    `-dCompatibilityLevel=${compatibilityLevel}`,
    `-dPDFSETTINGS=/${preset}`,
    "-dNOPAUSE",
    "-dBATCH",
    "-dSAFER",
    "-dQUIET",
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dAutoRotatePages=/None",
  ]

  if (dpi) {
    args.push(
      "-dDownsampleColorImages=true",
      "-dDownsampleGrayImages=true",
      "-dDownsampleMonoImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Subsample",
      `-dColorImageResolution=${dpi}`,
      `-dGrayImageResolution=${dpi}`,
      `-dMonoImageResolution=${dpi}`
    )
  }

  args.push(`-sOutputFile=${outputPath}`, inputPath)

  await runGhostscript(args, options)

  const [inputInfo, outputInfo] = await Promise.all([
    stat(inputPath),
    stat(outputPath),
  ])

  return {
    outputPath,
    ...createStats(inputInfo.size, outputInfo.size),
  }
}

export async function compressImageWithGhostscript(
  options: CompressImageWithGhostscriptOptions
): Promise<GhostscriptCompressionResult> {
  const inputPath = normalizePath(options.inputPath)
  const outputPath = normalizePath(
    options.outputPath || buildDefaultOutputPath(inputPath, ".compressed")
  )

  const device = resolveImageDevice(outputPath, options.device)
  const quality = clamp(options.quality ?? 82, 1, 100)
  const dpi = validateDpi(options.dpi)

  await ensureReadableFile(inputPath)
  await ensureOutputDirectory(outputPath)

  const args = [
    `-sDEVICE=${device}`,
    "-dNOPAUSE",
    "-dBATCH",
    "-dSAFER",
    "-dQUIET",
  ]

  if (device === "jpeg") {
    args.push(`-dJPEGQ=${quality}`)
  } else {
    args.push("-dTextAlphaBits=4", "-dGraphicsAlphaBits=4")
  }

  if (dpi) {
    args.push(`-r${dpi}`)
  }

  args.push(`-sOutputFile=${outputPath}`, inputPath)

  await runGhostscript(args, options)

  const [inputInfo, outputInfo] = await Promise.all([
    stat(inputPath),
    stat(outputPath),
  ])

  return {
    outputPath,
    ...createStats(inputInfo.size, outputInfo.size),
  }
}

export async function compressWithGhostscript(
  options: CompressWithGhostscriptOptions
): Promise<GhostscriptCompressionResult> {
  const resolvedKind =
    options.kind && options.kind !== "auto"
      ? options.kind
      : inferKindByPath(options.inputPath)

  if (resolvedKind === "pdf") {
    return compressPdfWithGhostscript({
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      gsPath: options.gsPath,
      timeoutMs: options.timeoutMs,
      cwd: options.cwd,
      preset: options.pdf?.preset,
      compatibilityLevel: options.pdf?.compatibilityLevel,
      dpi: options.pdf?.dpi,
    })
  }

  return compressImageWithGhostscript({
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    gsPath: options.gsPath,
    timeoutMs: options.timeoutMs,
    cwd: options.cwd,
    device: options.image?.device,
    quality: options.image?.quality,
    dpi: options.image?.dpi,
  })
}
