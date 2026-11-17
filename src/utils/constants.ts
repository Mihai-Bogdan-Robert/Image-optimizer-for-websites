import type { PresetDimensions, ResizeSettings, CompressSettings, ConvertSettings, RenameSettings } from '../types';

export const APP_VERSION = '1.0';

export const PRESET_SIZES: PresetDimensions[] = [
  {
    name: 'hero',
    label: 'Hero Image',
    width: 1920,
    height: 1080,
    description: 'Full-width hero banners (1920×1080)',
  },
  {
    name: 'none',
    label: 'No Resize',
    width: 0,
    height: 0,
    description: 'Keep original dimensions',
  },
  {
    name: 'normal',
    label: 'Normal',
    width: 1200,
    height: 800,
    description: 'Standard web images (1200×800)',
  },
  {
    name: 'custom',
    label: 'Custom Size',
    width: 0,
    height: 0,
    description: 'Set your own dimensions',
  },
];

export const DEFAULT_RESIZE_SETTINGS: ResizeSettings = {
  enabled: true,
  presetSize: 'normal',
  maxWidth: 1200,
  maxHeight: 800,
  maintainAspectRatio: true,
};

export const DEFAULT_COMPRESS_SETTINGS: CompressSettings = {
  enabled: true,
  quality: 100,
  compressionMode: 'lossless',
  stripMetadata: true,
};

export const DEFAULT_CONVERT_SETTINGS: ConvertSettings = {
  enabled: true,
  outputFormat: 'webp',
};

export const DEFAULT_RENAME_SETTINGS: RenameSettings = {
  enabled: true,
  keywords: [],
};

export const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

export const FORMAT_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};
