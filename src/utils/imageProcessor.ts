import imageCompression from 'browser-image-compression';
import type { ImageFile, OutputFormat, ResizeSettings, CompressSettings, ConvertSettings } from '../types';

/**
 * Get image dimensions from a file or blob
 */
export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert blob to file
 */
function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Resize image to specified dimensions
 */
export async function resizeImage(
  input: File | Blob,
  settings: ResizeSettings,
  currentFormat: string
): Promise<{ blob: Blob; width: number; height: number }> {
  // If resize is disabled or no dimensions specified, return original
  if (!settings.enabled || settings.presetSize === 'none') {
    const dimensions = await getImageDimensions(input);
    return { blob: input, ...dimensions };
  }

  const { maxWidth, maxHeight, maintainAspectRatio } = settings;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let targetWidth = maxWidth || img.width;
      let targetHeight = maxHeight || img.height;

      if (maintainAspectRatio && (maxWidth || maxHeight)) {
        const aspectRatio = img.width / img.height;
        
        if (maxWidth && maxHeight) {
          if (targetWidth / targetHeight > aspectRatio) {
            targetWidth = targetHeight * aspectRatio;
          } else {
            targetHeight = targetWidth / aspectRatio;
          }
        } else if (maxWidth) {
          targetHeight = maxWidth / aspectRatio;
        } else if (maxHeight) {
          targetWidth = maxHeight * aspectRatio;
        }
      }

      // Don't upscale images
      if (targetWidth > img.width) targetWidth = img.width;
      if (targetHeight > img.height) targetHeight = img.height;

      // If dimensions aren't changing, return original to preserve quality
      const finalWidth = Math.round(targetWidth);
      const finalHeight = Math.round(targetHeight);
      if (finalWidth === img.width && finalHeight === img.height) {
        URL.revokeObjectURL(img.src);
        resolve({ blob: input, width: img.width, height: img.height });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              width: canvas.width,
              height: canvas.height,
            });
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        currentFormat,
        0.92 // High quality but not max to prevent file bloat
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(input);
  });
}

/**
 * Find optimal quality for best size-to-quality ratio
 */
async function findOptimalQuality(
  file: File | Blob,
  mimeType: string
): Promise<number> {
  const qualities = [90, 85, 80, 75, 70, 65, 60];
  let bestQuality = 80;
  let bestRatio = 0;
  const originalSize = file.size;

  for (const quality of qualities) {
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed'))),
            mimeType,
            quality / 100
          );
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => reject(new Error('Failed to load'));
        img.src = URL.createObjectURL(file);
      });

      const compressionRatio = originalSize / blob.size;
      const qualityScore = quality / 100;
      const ratio = compressionRatio * qualityScore;

      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestQuality = quality;
      }
    } catch {
      continue;
    }
  }

  return bestQuality;
}

/**
 * Compress image
 */
export async function compressImage(
  input: File | Blob,
  settings: CompressSettings,
  fileName: string
): Promise<Blob> {
  if (!settings.enabled) {
    return input;
  }

  const file = input instanceof File ? input : blobToFile(input, fileName);
  
  let quality = settings.quality;
  
  // Auto mode: find optimal quality
  if (settings.compressionMode === 'auto') {
    quality = await findOptimalQuality(file, file.type);
  } else if (settings.compressionMode === 'lossless') {
    quality = 100;
  }

  const options = {
    maxSizeMB: 10,
    useWebWorker: true,
    initialQuality: quality / 100,
    preserveExif: !settings.stripMetadata,
  };

  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch {
    // Return original if compression fails
    return input;
  }
}

/**
 * Convert image to specified format
 */
export async function convertImage(
  input: File | Blob,
  settings: ConvertSettings,
  originalFormat: string
): Promise<{ blob: Blob; format: string }> {
  if (!settings.enabled || settings.outputFormat === 'original') {
    return { blob: input, format: originalFormat };
  }

  // SVG files are kept as-is
  if (originalFormat === 'image/svg+xml') {
    return { blob: input, format: originalFormat };
  }

  const targetMimeType = getMimeType(settings.outputFormat);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // For JPEG, fill white background (no transparency support)
      if (settings.outputFormat === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, format: targetMimeType });
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        targetMimeType,
        0.92
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for conversion'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(input);
  });
}

/**
 * Process image through all steps
 */
export async function processImageFull(
  imageFile: ImageFile,
  resizeSettings: ResizeSettings,
  compressSettings: CompressSettings,
  convertSettings: ConvertSettings
): Promise<{ blob: Blob; width: number; height: number; format: string }> {
  const input = imageFile.currentBlob || imageFile.originalFile;
  const currentFormat = imageFile.currentFormat || imageFile.format;

  // SVG files are kept as-is
  if (currentFormat === 'image/svg+xml') {
    const dimensions = await getImageDimensions(input);
    return {
      blob: input,
      width: dimensions.width,
      height: dimensions.height,
      format: currentFormat,
    };
  }

  // Step 1: Resize
  const resized = await resizeImage(input, resizeSettings, currentFormat);

  // Step 2: Compress
  const compressed = await compressImage(resized.blob, compressSettings, imageFile.name);

  // Step 3: Convert
  const converted = await convertImage(compressed, convertSettings, currentFormat);

  const dimensions = await getImageDimensions(converted.blob);

  return {
    blob: converted.blob,
    width: dimensions.width,
    height: dimensions.height,
    format: converted.format,
  };
}

/**
 * Get MIME type from output format
 */
function getMimeType(format: OutputFormat): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'image/webp';
  }
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
  };
  return map[mimeType] || 'png';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const value = parseFloat((absBytes / Math.pow(k, i)).toFixed(2));
  return `${bytes < 0 ? '-' : ''}${value} ${sizes[i]}`;
}

/**
 * Calculate compression percentage
 */
export function calculateCompression(originalSize: number, processedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - processedSize) / originalSize) * 100);
}
