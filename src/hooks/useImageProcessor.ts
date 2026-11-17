import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ImageFile, ResizeSettings, CompressSettings, ConvertSettings, RenameSettings, WizardStep, ProcessingProgress, ResizeGroup, PresetSize } from '../types';
import { resizeImage, compressImage, convertImage, getImageDimensions } from '../utils/imageProcessor';
import { DEFAULT_RESIZE_SETTINGS, DEFAULT_COMPRESS_SETTINGS, DEFAULT_CONVERT_SETTINGS, DEFAULT_RENAME_SETTINGS, SUPPORTED_FORMATS, PRESET_SIZES } from '../utils/constants';

export function useImageProcessor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [compressSettings, setCompressSettings] = useState<CompressSettings>(DEFAULT_COMPRESS_SETTINGS);
  const [convertSettings, setConvertSettings] = useState<ConvertSettings>(DEFAULT_CONVERT_SETTINGS);
  const [renameSettings, setRenameSettings] = useState<RenameSettings>(DEFAULT_RENAME_SETTINGS);
  const [resizeGroups, setResizeGroups] = useState<ResizeGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 0, percentage: 0 });

  /**
   * Add files to the processor
   */
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => SUPPORTED_FORMATS.includes(file.type));

    const newImages: ImageFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const dimensions = await getImageDimensions(file).catch(() => ({ width: 0, height: 0 }));
        
        return {
          id: uuidv4(),
          originalFile: file,
          originalUrl: URL.createObjectURL(file),
          name: file.name,
          originalSize: file.size,
          currentSize: file.size,
          format: file.type,
          currentFormat: file.type,
          status: 'pending' as const,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          width: dimensions.width,
          height: dimensions.height,
        };
      })
    );

    setImages((prev) => [...prev, ...newImages]);
    return newImages;
  }, []);

  /**
   * Process resize step for all images using groups
   */
  const processResize = useCallback(async () => {
    // If using groups, process by group
    if (resizeGroups.length > 0) {
      setIsProcessing(true);
      const totalImages = resizeGroups.reduce((sum, g) => sum + g.imageIds.length, 0);
      setProgress({ current: 0, total: totalImages, percentage: 0 });
      
      let processedCount = 0;

      for (const group of resizeGroups) {
        // Skip groups with 'none' preset
        if (group.presetSize === 'none') {
          processedCount += group.imageIds.length;
          setProgress({
            current: processedCount,
            total: totalImages,
            percentage: Math.round((processedCount / totalImages) * 100),
          });
          continue;
        }

        const preset = PRESET_SIZES.find((p) => p.name === group.presetSize);
        const groupSettings: ResizeSettings = {
          enabled: true,
          presetSize: group.presetSize,
          maxWidth: group.presetSize === 'custom' ? (group.customWidth || 800) : (preset?.width || 800),
          maxHeight: group.presetSize === 'custom' ? (group.customHeight || 600) : (preset?.height || 600),
          maintainAspectRatio: true,
        };

        for (const imageId of group.imageIds) {
          const image = images.find((img) => img.id === imageId);
          if (!image) continue;

          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, status: 'processing' as const } : img
            )
          );

          try {
            const input = image.currentBlob || image.originalFile;
            const result = await resizeImage(input, groupSettings, image.currentFormat);
            
            if (image.currentUrl && image.currentUrl !== image.originalUrl) {
              URL.revokeObjectURL(image.currentUrl);
            }

            const updatedImage: ImageFile = {
              ...image,
              currentBlob: result.blob,
              currentUrl: URL.createObjectURL(result.blob),
              currentSize: result.blob.size,
              width: result.width,
              height: result.height,
              status: 'completed' as const,
            };

            setImages((prev) =>
              prev.map((img) => (img.id === image.id ? updatedImage : img))
            );
          } catch (error) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? { ...img, status: 'error' as const, error: error instanceof Error ? error.message : 'Resize failed' }
                  : img
              )
            );
          }

          processedCount++;
          setProgress({
            current: processedCount,
            total: totalImages,
            percentage: Math.round((processedCount / totalImages) * 100),
          });
        }
      }

      setIsProcessing(false);
      setImages((prev) => prev.map((img) => ({ ...img, status: 'pending' as const })));
      return;
    }

    // Fallback to global settings if no groups
    if (!resizeSettings.enabled || resizeSettings.presetSize === 'none') {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: images.length, percentage: 0 });

    const updatedImages: ImageFile[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'processing' as const } : img
        )
      );

      try {
        const input = image.currentBlob || image.originalFile;
        const result = await resizeImage(input, resizeSettings, image.currentFormat);
        
        // Revoke old URL if exists
        if (image.currentUrl && image.currentUrl !== image.originalUrl) {
          URL.revokeObjectURL(image.currentUrl);
        }

        const updatedImage: ImageFile = {
          ...image,
          currentBlob: result.blob,
          currentUrl: URL.createObjectURL(result.blob),
          currentSize: result.blob.size,
          width: result.width,
          height: result.height,
          status: 'completed' as const,
        };

        updatedImages.push(updatedImage);

        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? updatedImage : img))
        );
      } catch (error) {
        const errorImage: ImageFile = {
          ...image,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Resize failed',
        };
        updatedImages.push(errorImage);

        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? errorImage : img))
        );
      }

      setProgress({
        current: i + 1,
        total: images.length,
        percentage: Math.round(((i + 1) / images.length) * 100),
      });
    }

    setIsProcessing(false);
    // Reset status to pending for next step
    setImages((prev) => prev.map((img) => ({ ...img, status: 'pending' as const })));
  }, [images, resizeSettings, resizeGroups]);

  /**
   * Process compress step for all images
   */
  const processCompress = useCallback(async () => {
    if (!compressSettings.enabled) {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: images.length, percentage: 0 });

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'processing' as const } : img
        )
      );

      try {
        const input = image.currentBlob || image.originalFile;
        const result = await compressImage(input, compressSettings, image.name);
        
        // Revoke old URL if exists
        if (image.currentUrl && image.currentUrl !== image.originalUrl) {
          URL.revokeObjectURL(image.currentUrl);
        }

        const dimensions = await getImageDimensions(result);

        const updatedImage: ImageFile = {
          ...image,
          currentBlob: result,
          currentUrl: URL.createObjectURL(result),
          currentSize: result.size,
          width: dimensions.width,
          height: dimensions.height,
          status: 'completed' as const,
        };

        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? updatedImage : img))
        );
      } catch (error) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, status: 'error' as const, error: error instanceof Error ? error.message : 'Compression failed' }
              : img
          )
        );
      }

      setProgress({
        current: i + 1,
        total: images.length,
        percentage: Math.round(((i + 1) / images.length) * 100),
      });
    }

    setIsProcessing(false);
    setImages((prev) => prev.map((img) => ({ ...img, status: 'pending' as const })));
  }, [images, compressSettings]);

  /**
   * Process convert step for all images
   */
  const processConvert = useCallback(async () => {
    if (!convertSettings.enabled || convertSettings.outputFormat === 'original') {
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: images.length, percentage: 0 });

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'processing' as const } : img
        )
      );

      try {
        const input = image.currentBlob || image.originalFile;
        const result = await convertImage(input, convertSettings, image.currentFormat);
        
        // Revoke old URL if exists
        if (image.currentUrl && image.currentUrl !== image.originalUrl) {
          URL.revokeObjectURL(image.currentUrl);
        }

        const dimensions = await getImageDimensions(result.blob);

        const updatedImage: ImageFile = {
          ...image,
          currentBlob: result.blob,
          currentUrl: URL.createObjectURL(result.blob),
          currentSize: result.blob.size,
          currentFormat: result.format,
          width: dimensions.width,
          height: dimensions.height,
          status: 'completed' as const,
        };

        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? updatedImage : img))
        );
      } catch (error) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, status: 'error' as const, error: error instanceof Error ? error.message : 'Conversion failed' }
              : img
          )
        );
      }

      setProgress({
        current: i + 1,
        total: images.length,
        percentage: Math.round(((i + 1) / images.length) * 100),
      });
    }

    setIsProcessing(false);
    setImages((prev) => prev.map((img) => ({ ...img, status: 'pending' as const })));
  }, [images, convertSettings]);

  /**
   * Update resize settings
   */
  const updateResizeSettings = useCallback((settings: Partial<ResizeSettings>) => {
    setResizeSettings((prev) => {
      const updated = { ...prev, ...settings };
      // Update dimensions when preset changes
      if (settings.presetSize && settings.presetSize !== 'custom' && settings.presetSize !== 'none') {
        const preset = PRESET_SIZES.find((p) => p.name === settings.presetSize);
        if (preset) {
          updated.maxWidth = preset.width;
          updated.maxHeight = preset.height;
        }
      }
      return updated;
    });
  }, []);

  /**
   * Remove an image from the list
   */
  const removeImage = useCallback((imageId: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.originalUrl);
        if (image.currentUrl && image.currentUrl !== image.originalUrl) {
          URL.revokeObjectURL(image.currentUrl);
        }
      }
      return prev.filter((img) => img.id !== imageId);
    });
  }, []);

  /**
   * Clear all images
   */
  const clearAllImages = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.currentUrl && img.currentUrl !== img.originalUrl) {
        URL.revokeObjectURL(img.currentUrl);
      }
    });
    setImages([]);
    setCurrentStep('upload');
  }, [images]);

  /**
   * Reset to start
   */
  const resetToStart = useCallback(() => {
    // Reset images to original state
    setImages((prev) =>
      prev.map((img) => {
        if (img.currentUrl && img.currentUrl !== img.originalUrl) {
          URL.revokeObjectURL(img.currentUrl);
        }
        return {
          ...img,
          currentBlob: undefined,
          currentUrl: undefined,
          currentSize: img.originalSize,
          currentFormat: img.format,
          width: img.originalWidth,
          height: img.originalHeight,
          status: 'pending' as const,
          error: undefined,
        };
      })
    );
    setCurrentStep('upload');
    setResizeSettings(DEFAULT_RESIZE_SETTINGS);
    setCompressSettings(DEFAULT_COMPRESS_SETTINGS);
    setConvertSettings(DEFAULT_CONVERT_SETTINGS);
    setResizeGroups([]);
  }, []);

  /**
   * Create a new resize group
   */
  const createResizeGroup = useCallback((name: string, preset: PresetSize) => {
    const newGroup: ResizeGroup = {
      id: uuidv4(),
      name,
      presetSize: preset,
      imageIds: [],
    };
    setResizeGroups((prev) => [...prev, newGroup]);
    return newGroup.id;
  }, []);

  /**
   * Update a resize group
   */
  const updateResizeGroup = useCallback((groupId: string, updates: Partial<ResizeGroup>) => {
    setResizeGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  }, []);

  /**
   * Delete a resize group
   */
  const deleteResizeGroup = useCallback((groupId: string) => {
    setResizeGroups((prev) => prev.filter((group) => group.id !== groupId));
  }, []);

  /**
   * Add images to a group
   */
  const addImagesToGroup = useCallback((groupId: string, imageIds: string[]) => {
    setResizeGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const existingIds = new Set(group.imageIds);
          const newIds = imageIds.filter((id) => !existingIds.has(id));
          return { ...group, imageIds: [...group.imageIds, ...newIds] };
        }
        // Remove from other groups
        return {
          ...group,
          imageIds: group.imageIds.filter((id) => !imageIds.includes(id)),
        };
      })
    );
  }, []);

  /**
   * Remove image from group
   */
  const removeImageFromGroup = useCallback((groupId: string, imageId: string) => {
    setResizeGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, imageIds: group.imageIds.filter((id) => id !== imageId) }
          : group
      )
    );
  }, []);

  /**
   * Get total savings
   */
  const getTotalSavings = useCallback(() => {
    const originalTotal = images.reduce((sum, img) => sum + img.originalSize, 0);
    const currentTotal = images.reduce((sum, img) => sum + (img.currentSize || img.originalSize), 0);
    return {
      originalTotal,
      currentTotal,
      saved: originalTotal - currentTotal,
      percentage: originalTotal > 0 ? Math.round(((originalTotal - currentTotal) / originalTotal) * 100) : 0,
    };
  }, [images]);

  /**
   * Apply rename mappings to images
   */
  const applyRenames = useCallback((renames: Map<string, string>) => {
    setImages((prev) =>
      prev.map((img) => {
        const newName = renames.get(img.id);
        if (newName) {
          return { ...img, name: newName };
        }
        return img;
      })
    );
  }, []);

  return {
    images,
    currentStep,
    setCurrentStep,
    resizeSettings,
    compressSettings,
    convertSettings,
    renameSettings,
    resizeGroups,
    isProcessing,
    progress,
    addFiles,
    processResize,
    processCompress,
    processConvert,
    updateResizeSettings,
    setCompressSettings,
    setConvertSettings,
    setRenameSettings,
    applyRenames,
    removeImage,
    clearAllImages,
    resetToStart,
    getTotalSavings,
    createResizeGroup,
    updateResizeGroup,
    deleteResizeGroup,
    addImagesToGroup,
    removeImageFromGroup,
  };
}
