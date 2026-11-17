export interface ImageFile {
  id: string;
  originalFile: File;
  originalUrl: string;
  currentBlob?: Blob;
  currentUrl?: string;
  name: string;
  originalSize: number;
  currentSize?: number;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  format: string;
  currentFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'original';

export type CompressionMode = 'lossy' | 'lossless' | 'auto';

export type PresetSize = 'hero' | 'normal' | 'custom' | 'none';

export interface ResizeGroup {
  id: string;
  name: string;
  presetSize: PresetSize;
  customWidth?: number;
  customHeight?: number;
  imageIds: string[];
}

export interface PresetDimensions {
  name: PresetSize;
  label: string;
  width: number;
  height: number;
  description: string;
}

export interface ResizeSettings {
  enabled: boolean;
  presetSize: PresetSize;
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio: boolean;
}

export interface CompressSettings {
  enabled: boolean;
  quality: number;
  compressionMode: CompressionMode;
  stripMetadata: boolean;
}

export interface ConvertSettings {
  enabled: boolean;
  outputFormat: OutputFormat;
}

export interface RenameSettings {
  enabled: boolean;
  keywords: string[];
}

export type WizardStep = 'upload' | 'resize' | 'compress' | 'convert' | 'rename';

export interface ProcessingProgress {
  current: number;
  total: number;
  percentage: number;
}
