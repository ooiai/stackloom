use image::{
    ColorType, DynamicImage, GenericImageView, ImageEncoder,
    codecs::jpeg::JpegEncoder,
    codecs::png::{CompressionType as PngCompressionType, FilterType as PngFilterType, PngEncoder},
    imageops::FilterType,
};
use lopdf::Document;

const MAX_IMAGE_EDGE: u32 = 2400;
const JPEG_QUALITY: u8 = 82;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileCompressionKind {
    Pdf,
    Image,
    Other,
}

#[derive(Debug, Clone)]
pub struct FileCompressionResult {
    pub kind: FileCompressionKind,
    pub extension: String,
    pub data: Vec<u8>,
    pub compressed: bool,
    pub original_size: usize,
    pub compressed_size: usize,
}

pub fn compress_document_bytes(
    filename_hint: &str,
    file_type_hint: Option<&str>,
    storage_path_hint: Option<&str>,
    data: Vec<u8>,
) -> FileCompressionResult {
    let extension = infer_extension(filename_hint, file_type_hint, storage_path_hint);
    let original_size = data.len();
    let kind = infer_kind(&extension);

    let compressed_data = match kind {
        FileCompressionKind::Pdf => compress_pdf(&data).unwrap_or_else(|| data.clone()),
        FileCompressionKind::Image => {
            compress_image(&extension, &data).unwrap_or_else(|| data.clone())
        }
        FileCompressionKind::Other => data.clone(),
    };

    let compressed = compressed_data.len() < data.len();
    let final_data = if compressed { compressed_data } else { data };
    let compressed_size = final_data.len();

    FileCompressionResult {
        kind,
        extension,
        data: final_data,
        compressed,
        original_size,
        compressed_size,
    }
}

fn infer_kind(extension: &str) -> FileCompressionKind {
    if extension == "pdf" {
        return FileCompressionKind::Pdf;
    }

    if matches!(
        extension,
        "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif" | "tif" | "tiff"
    ) {
        return FileCompressionKind::Image;
    }

    FileCompressionKind::Other
}

fn infer_extension(
    filename_hint: &str,
    file_type_hint: Option<&str>,
    storage_path_hint: Option<&str>,
) -> String {
    normalize_extension(file_type_hint)
        .or_else(|| ext_from_path(filename_hint))
        .or_else(|| storage_path_hint.and_then(ext_from_path))
        .unwrap_or_else(|| "bin".to_string())
}

fn normalize_extension(file_type_hint: Option<&str>) -> Option<String> {
    let raw = file_type_hint?.trim().to_lowercase();
    if raw.is_empty() {
        return None;
    }

    let from_mime = raw
        .rsplit_once('/')
        .map(|(_, suffix)| suffix.to_string())
        .filter(|suffix| !suffix.is_empty());
    let mut normalized = from_mime.unwrap_or(raw);
    normalized = normalized.trim_start_matches('.').to_string();
    if normalized.is_empty() {
        return None;
    }

    match normalized.as_str() {
        "pjpeg" => Some("jpg".to_string()),
        "x-png" => Some("png".to_string()),
        _ => Some(normalized),
    }
}

fn ext_from_path(path: &str) -> Option<String> {
    let path = path.trim();
    if path.is_empty() {
        return None;
    }

    let path = path.split('?').next().unwrap_or(path);
    let filename = path.rsplit('/').next().unwrap_or(path);
    let ext = filename.rsplit_once('.')?.1.trim().to_lowercase();
    if ext.is_empty() {
        return None;
    }
    Some(ext)
}

fn compress_pdf(input: &[u8]) -> Option<Vec<u8>> {
    let mut doc = Document::load_mem(input).ok()?;
    doc.compress();

    let mut output = Vec::with_capacity(input.len());
    doc.save_to(&mut output).ok()?;

    Some(output)
}

fn compress_image(extension: &str, input: &[u8]) -> Option<Vec<u8>> {
    let decoded = image::load_from_memory(input).ok()?;
    let optimized = resize_if_needed(decoded);

    match extension {
        "jpg" | "jpeg" => encode_jpeg(&optimized),
        "png" => encode_png(&optimized),
        _ => None,
    }
}

fn resize_if_needed(image: DynamicImage) -> DynamicImage {
    let (width, height) = image.dimensions();
    let max_edge = width.max(height);
    if max_edge <= MAX_IMAGE_EDGE {
        return image;
    }

    let ratio = MAX_IMAGE_EDGE as f32 / max_edge as f32;
    let target_width = ((width as f32) * ratio).round().max(1.0) as u32;
    let target_height = ((height as f32) * ratio).round().max(1.0) as u32;
    image.resize(target_width, target_height, FilterType::Lanczos3)
}

fn encode_jpeg(image: &DynamicImage) -> Option<Vec<u8>> {
    let mut output = Vec::new();
    let mut encoder = JpegEncoder::new_with_quality(&mut output, JPEG_QUALITY);
    encoder.encode_image(image).ok()?;
    Some(output)
}

fn encode_png(image: &DynamicImage) -> Option<Vec<u8>> {
    let rgba = image.to_rgba8();
    let (width, height) = rgba.dimensions();
    let mut output = Vec::new();
    let encoder = PngEncoder::new_with_quality(
        &mut output,
        PngCompressionType::Best,
        PngFilterType::Adaptive,
    );
    encoder
        .write_image(rgba.as_raw(), width, height, ColorType::Rgba8.into())
        .ok()?;
    Some(output)
}
