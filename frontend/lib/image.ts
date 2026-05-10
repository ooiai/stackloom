export type ImageCropRect = {
  x: number
  y: number
  width: number
  height: number
}

export type ImageCompressionOptions = {
  maxDimension?: number
  preferredType?: string
  preferredQuality?: number
  fallbackType?: string
  fallbackQuality?: number
  fileName?: string
}

export const AVATAR_IMAGE_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  maxDimension: 512,
  preferredType: "image/webp",
  preferredQuality: 0.72,
  fallbackType: "image/png",
}

function getFileExtensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/webp":
      return "webp"
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    default:
      return "bin"
  }
}

function getFileNameBase(fileName: string) {
  const trimmed = fileName.trim()
  if (!trimmed) {
    return "image"
  }

  const lastDot = trimmed.lastIndexOf(".")
  if (lastDot <= 0) {
    return trimmed
  }

  return trimmed.slice(0, lastDot)
}

function buildOutputFileName(fileName: string, mimeType: string) {
  const base = getFileNameBase(fileName)
  return `${base}.${getFileExtensionForMimeType(mimeType)}`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to load image"))
    image.src = src
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })
}

async function canvasToImageFile(
  canvas: HTMLCanvasElement,
  options: ImageCompressionOptions
) {
  const preferredType = options.preferredType ?? "image/webp"
  const fallbackType = options.fallbackType ?? "image/png"
  const preferredBlob = await canvasToBlob(
    canvas,
    preferredType,
    options.preferredQuality
  )
  const blob =
    preferredBlob ??
    (await canvasToBlob(canvas, fallbackType, options.fallbackQuality))

  if (!blob) {
    throw new Error("Unable to generate compressed image")
  }

  const outputType = preferredBlob ? preferredType : fallbackType
  return new File(
    [blob],
    buildOutputFileName(options.fileName ?? "image", outputType),
    {
      type: outputType,
    }
  )
}

function drawImageToCanvas(
  image: HTMLImageElement,
  crop: ImageCropRect,
  maxDimension: number
) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Canvas context is not available")
  }

  const targetMaxDimension = Math.max(1, maxDimension)
  const resizeScale = Math.min(
    1,
    targetMaxDimension / Math.max(crop.width, crop.height)
  )

  canvas.width = Math.max(1, Math.floor(crop.width * resizeScale))
  canvas.height = Math.max(1, Math.floor(crop.height * resizeScale))

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas
}

export async function cropImageToFile(
  image: HTMLImageElement,
  crop: ImageCropRect,
  options: ImageCompressionOptions = AVATAR_IMAGE_COMPRESSION_OPTIONS
) {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const canvas = drawImageToCanvas(
    image,
    {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    },
    options.maxDimension ?? AVATAR_IMAGE_COMPRESSION_OPTIONS.maxDimension ?? 512
  )

  return canvasToImageFile(canvas, {
    ...AVATAR_IMAGE_COMPRESSION_OPTIONS,
    ...options,
  })
}

export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = AVATAR_IMAGE_COMPRESSION_OPTIONS
) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const canvas = drawImageToCanvas(
      image,
      {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      },
      options.maxDimension ??
        AVATAR_IMAGE_COMPRESSION_OPTIONS.maxDimension ??
        512
    )

    return canvasToImageFile(canvas, {
      ...AVATAR_IMAGE_COMPRESSION_OPTIONS,
      ...options,
      fileName: options.fileName ?? file.name,
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
