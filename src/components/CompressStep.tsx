import React from 'react';
import type { ImageFile, CompressSettings, CompressionMode, ProcessingProgress } from '../types';
import { formatFileSize, calculateCompression } from '../utils/imageProcessor';
import styles from './StepPanel.module.css';

interface CompressStepProps {
  images: ImageFile[];
  settings: CompressSettings;
  isProcessing: boolean;
  progress: ProcessingProgress;
  onSettingsChange: (settings: Partial<CompressSettings>) => void;
  onProcess: () => void;
  onSkip: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

const COMPRESSION_MODES: {
  mode: CompressionMode;
  title: string;
  description: string;
  qualityLoss: string;
  savingsEstimate: string;
  icon: string;
}[] = [
  {
    mode: 'lossy',
    title: 'Lossy Compression',
    description: 'Significantly reduces file size by removing some image data. Best for web images where small file size matters more than pixel-perfect quality.',
    qualityLoss: 'Minor visual differences, usually unnoticeable',
    savingsEstimate: '60-80%',
    icon: '🚀',
  },
  {
    mode: 'lossless',
    title: 'Lossless Compression',
    description: 'Reduces file size without losing any image quality. The image remains identical to the original, just stored more efficiently.',
    qualityLoss: 'No quality loss — pixel-perfect',
    savingsEstimate: '10-30%',
    icon: '✨',
  },
];

export const CompressStep: React.FC<CompressStepProps> = ({
  images,
  settings,
  isProcessing,
  progress,
  onSettingsChange,
  onProcess,
  onSkip,
  onDownload,
  onContinue,
}) => {
  const totalCurrent = images.reduce((sum, img) => sum + (img.currentSize || img.originalSize), 0);
  const hasProcessed = images.some((img) => img.status === 'completed' || img.currentBlob);

  // Find the highest resolution image for comparison (by pixel count)
  const highestResImage = images.reduce((highest, img) => {
    const currentPixels = (img.originalWidth || 0) * (img.originalHeight || 0);
    const highestPixels = (highest?.originalWidth || 0) * (highest?.originalHeight || 0);
    return currentPixels > highestPixels ? img : highest;
  }, images[0]);

  // Calculate expected savings based on selected mode
  const selectedModeInfo = COMPRESSION_MODES.find((m) => m.mode === settings.compressionMode);
  const estimatedSavingsPercent = settings.compressionMode === 'lossy' ? 0.7 : 0.2;
  const estimatedSavings = Math.round(totalCurrent * estimatedSavingsPercent);

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHeader}>
        <div className={styles.stepInfo}>
          <h3>Compress Images</h3>
          <p>Reduce file size while maintaining quality</p>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip this step
        </button>
      </div>

      {/* Compression Mode Selection */}
      <div className={styles.modeSelection}>
        {COMPRESSION_MODES.map((modeInfo) => (
          <div
            key={modeInfo.mode}
            className={`${styles.modeCard} ${settings.compressionMode === modeInfo.mode ? styles.modeCardActive : ''}`}
            onClick={() => onSettingsChange({ 
              compressionMode: modeInfo.mode,
              quality: modeInfo.mode === 'lossy' ? 75 : 100
            })}
          >
            <div className={styles.modeIcon}>{modeInfo.icon}</div>
            <div className={styles.modeContent}>
              <h4>{modeInfo.title}</h4>
              <p className={styles.modeDescription}>{modeInfo.description}</p>
              <div className={styles.modeDetails}>
                <div className={styles.modeDetail}>
                  <span className={styles.modeDetailLabel}>Quality:</span>
                  <span className={styles.modeDetailValue}>{modeInfo.qualityLoss}</span>
                </div>
                <div className={styles.modeDetail}>
                  <span className={styles.modeDetailLabel}>Typical savings:</span>
                  <span className={styles.modeDetailValue}>{modeInfo.savingsEstimate}</span>
                </div>
              </div>
            </div>
            <div className={styles.modeCheck}>
              {settings.compressionMode === modeInfo.mode && '✓'}
            </div>
          </div>
        ))}
      </div>

      {/* Expected Savings */}
      <div className={styles.expectedSavings}>
        <div className={styles.expectedSavingsContent}>
          <div className={styles.expectedSavingsIcon}>💾</div>
          <div className={styles.expectedSavingsText}>
            <h4>Expected Savings</h4>
            <p>
              With <strong>{selectedModeInfo?.title}</strong>, you can expect to save approximately{' '}
              <strong>{formatFileSize(estimatedSavings)}</strong> ({selectedModeInfo?.savingsEstimate} reduction)
            </p>
          </div>
        </div>
        <div className={styles.expectedSavingsAmount}>
          ~{formatFileSize(estimatedSavings)}
        </div>
      </div>

      {/* Options */}
      <div className={styles.settingsCard}>
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="stripMetadata"
            checked={settings.stripMetadata}
            onChange={(e) => onSettingsChange({ stripMetadata: e.target.checked })}
          />
          <label htmlFor="stripMetadata">Strip metadata (EXIF, GPS, camera info, etc.)</label>
        </div>
      </div>

      {isProcessing && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
          </div>
          <p className={styles.progressText}>
            Compressing {progress.current} of {progress.total} images...
          </p>
        </div>
      )}

      {hasProcessed && highestResImage && (
        <div className={styles.comparisonSection}>
          <div className={styles.comparisonHeader}>
            <h4>Before / After Comparison</h4>
          </div>
          <div className={styles.comparisonContainer}>
            <div className={styles.comparisonSide}>
              <div className={styles.comparisonLabel}>Before</div>
              <div className={styles.comparisonImageWrapper}>
                <img src={highestResImage.originalUrl} alt="Original" />
              </div>
              <div className={styles.comparisonStats}>
                <span>{formatFileSize(highestResImage.originalSize)}</span>
                <span>{highestResImage.originalWidth}×{highestResImage.originalHeight}</span>
              </div>
            </div>
            <div className={styles.comparisonDivider}>
              <span>→</span>
            </div>
            <div className={styles.comparisonSide}>
              <div className={styles.comparisonLabel}>After</div>
              <div className={styles.comparisonImageWrapper}>
                <img src={highestResImage.currentUrl || highestResImage.originalUrl} alt="Compressed" />
              </div>
              <div className={styles.comparisonStats}>
                <span>{formatFileSize(highestResImage.currentSize || highestResImage.originalSize)}</span>
                <span className={styles.comparisonSaved}>
                  -{calculateCompression(highestResImage.originalSize, highestResImage.currentSize || highestResImage.originalSize)}%
                </span>
              </div>
            </div>
          </div>
          <p className={styles.comparisonHint}>
            💡 Compare the images above to check if the compression quality is acceptable. If you want different settings, change them above and click "Compress Images" again.
          </p>
        </div>
      )}

      <div className={styles.stepActions}>
        <div className={styles.stepActionsLeft}>
          {hasProcessed && (
            <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={onDownload}>
              ⬇️ Download Now
            </button>
          )}
        </div>
        <div className={styles.stepActionsRight}>
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={onProcess}
            disabled={isProcessing}
          >
            {isProcessing ? 'Compressing...' : hasProcessed ? 'Compress Again' : 'Compress Images'}
          </button>
          {hasProcessed && (
            <button className={`${styles.actionBtn} ${styles.success}`} onClick={onContinue}>
              Continue to Rename →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};