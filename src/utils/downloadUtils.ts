import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ImageFile } from '../types';
import { getExtensionFromMimeType } from './imageProcessor';

/**
 * Download a single image
 */
export function downloadSingleImage(imageFile: ImageFile): void {
  const blob = imageFile.currentBlob || imageFile.originalFile;
  const format = imageFile.currentFormat || imageFile.format;
  
  const extension = getExtensionFromMimeType(format);
  const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
  const fileName = `${baseName}_optimized.${extension}`;

  saveAs(blob, fileName);
}

/**
 * Download all images as a ZIP file
 */
export async function downloadAllAsZip(
  images: ImageFile[],
  zipName: string = 'optimized-images'
): Promise<void> {
  const zip = new JSZip();

  if (images.length === 0) {
    console.error('No images available');
    return;
  }

  // Track used names to avoid duplicates
  const usedNames = new Map<string, number>();

  for (const imageFile of images) {
    const blob = imageFile.currentBlob || imageFile.originalFile;
    const format = imageFile.currentFormat || imageFile.format;
    
    const extension = getExtensionFromMimeType(format);
    let baseName = imageFile.name.replace(/\.[^/.]+$/, '');
    
    // Handle duplicate names
    const nameKey = baseName.toLowerCase();
    if (usedNames.has(nameKey)) {
      const count = usedNames.get(nameKey)! + 1;
      usedNames.set(nameKey, count);
      baseName = `${baseName}_${count}`;
    } else {
      usedNames.set(nameKey, 1);
    }

    const fileName = `${baseName}.${extension}`;
    zip.file(fileName, blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `${zipName}_${timestamp}.zip`);
}
