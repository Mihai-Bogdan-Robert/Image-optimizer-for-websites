import React, { useCallback, useState, useRef } from 'react';
import type { ImageFile } from '../types';
import styles from './DropZone.module.css';

interface DropZoneProps {
  images: ImageFile[];
  onFilesAdded: (files: FileList | File[]) => void;
  onRemoveImage: (id: string) => void;
  onContinue: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  images, 
  onFilesAdded, 
  onRemoveImage,
  onContinue 
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      const processEntry = async (entry: FileSystemEntry): Promise<void> => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          return new Promise((resolve) => {
            fileEntry.file((file) => {
              if (file.type.startsWith('image/')) {
                files.push(file);
              }
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const reader = dirEntry.createReader();
          return new Promise((resolve) => {
            reader.readEntries(async (entries) => {
              for (const subEntry of entries) {
                await processEntry(subEntry);
              }
              resolve();
            });
          });
        }
      };

      if (items) {
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }

        for (const entry of entries) {
          await processEntry(entry);
        }

        if (files.length > 0) {
          onFilesAdded(files);
        }
      }
    },
    [onFilesAdded]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesAdded(e.target.files);
        e.target.value = '';
      }
    },
    [onFilesAdded]
  );

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleFileClick}
      >
        <div className={styles.dropzoneContent}>
          <div className={styles.uploadIcon}>📁</div>
          <h3>Drop images here</h3>
          <p>or click to browse your files</p>
          
          <div className={styles.uploadButtons} onClick={(e) => e.stopPropagation()}>
            <button className={`${styles.uploadBtn} ${styles.primary}`} onClick={handleFileClick}>
              Select Files
            </button>
            <button className={`${styles.uploadBtn} ${styles.secondary}`} onClick={handleFolderClick}>
              Select Folder
            </button>
          </div>

          <p className={styles.supportedFormats}>
            JPEG, PNG, GIF, WebP, SVG, BMP, TIFF
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          accept="image/*"
          multiple
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          className={styles.hiddenInput}
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      </div>

      {images.length > 0 && (
        <div className={styles.imageList}>
          <div className={styles.imageListHeader}>
            <div className={styles.headerLeft}>
              <h4>Selected Images</h4>
              <span className={styles.imageCount}>{images.length} files</span>
            </div>
            <button 
              className={styles.continueBtn}
              onClick={onContinue}
              disabled={images.length === 0}
            >
              Continue to Resize →
            </button>
          </div>
          
          <div className={styles.imageGrid}>
            {images.map((image) => (
              <div key={image.id} className={styles.imageThumb}>
                <img src={image.originalUrl} alt={image.name} />
                <button 
                  className={styles.removeBtn}
                  onClick={() => onRemoveImage(image.id)}
                >
                  ×
                </button>
                <div className={styles.imageName}>{image.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
