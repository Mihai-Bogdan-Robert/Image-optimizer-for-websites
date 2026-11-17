import React from 'react';
import type { ImageFile, ConvertSettings, OutputFormat, ProcessingProgress } from '../types';
import styles from './StepPanel.module.css';

interface ConvertStepProps {
  images: ImageFile[];
  settings: ConvertSettings;
  isProcessing: boolean;
  progress: ProcessingProgress;
  onSettingsChange: (settings: Partial<ConvertSettings>) => void;
  onProcess: () => void;
  onSkip: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

const FORMAT_OPTIONS = [
  { value: 'webp', label: 'WebP', icon: '🌐', description: 'Best for web' },
  { value: 'jpeg', label: 'JPEG', icon: '📷', description: 'Photos' },
  { value: 'png', label: 'PNG', icon: '🖼️', description: 'Transparency' },
  { value: 'original', label: 'Keep Original', icon: '📄', description: 'No change' },
];

export const ConvertStep: React.FC<ConvertStepProps> = ({
  settings,
  isProcessing,
  progress,
  onSettingsChange,
  onProcess,
  onSkip,
  onContinue,
}) => {

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHeader}>
        <div className={styles.stepInfo}>
          <h3>Convert Format</h3>
          <p>Change image format for better compatibility or smaller size</p>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip & Download
        </button>
      </div>

      <div className={styles.settingsCard}>
        <div className={styles.formatCards}>
          {FORMAT_OPTIONS.map((format) => (
            <div
              key={format.value}
              className={`${styles.formatCard} ${settings.outputFormat === format.value ? styles.active : ''}`}
              onClick={() => onSettingsChange({ 
                outputFormat: format.value as OutputFormat,
                enabled: format.value !== 'original'
              })}
            >
              <div className={styles.formatIcon}>{format.icon}</div>
              <h4>{format.label}</h4>
              <p>{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      {isProcessing && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
          </div>
          <p className={styles.progressText}>
            Converting {progress.current} of {progress.total} images...
          </p>
        </div>
      )}

      <div className={styles.stepActions}>
        <div className={styles.stepActionsLeft}>
          <button className={`${styles.actionBtn} ${styles.outline}`} onClick={onSkip}>
            Skip →
          </button>
        </div>
        <div className={styles.stepActionsRight}>
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={onProcess}
            disabled={isProcessing || settings.outputFormat === 'original'}
          >
            {isProcessing ? 'Converting...' : `Convert to ${settings.outputFormat.toUpperCase()}`}
          </button>
          <button className={`${styles.actionBtn} ${styles.success}`} onClick={onContinue}>
            Continue to Compress →
          </button>
        </div>
      </div>
    </div>
  );
};