import React, { useState, useMemo } from 'react';
import type { ImageFile, RenameSettings } from '../types';
import { getExtensionFromMimeType } from '../utils/imageProcessor';
import styles from './StepPanel.module.css';

interface RenameStepProps {
  images: ImageFile[];
  settings: RenameSettings;
  onSettingsChange: (settings: Partial<RenameSettings>) => void;
  onApplyRenames: (renames: Map<string, string>) => void;
  onDownload: () => void;
  onStartOver: () => void;
}

/**
 * Calculate minimum keywords needed to generate enough permutations
 * for all images. n! >= numImages
 */
function calculateRequiredKeywords(numImages: number): number {
  if (numImages <= 1) return 1;
  for (let n = 1; n <= numImages; n++) {
    let factorial = 1;
    for (let i = 2; i <= n; i++) {
      factorial *= i;
    }
    if (factorial >= numImages) {
      return n;
    }
  }
  return numImages;
}

/**
 * Generate all permutations of an array
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  
  const result: T[][] = [];
  
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = getPermutations(remaining);
    
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  
  return result;
}

export const RenameStep: React.FC<RenameStepProps> = ({
  images,
  settings,
  onSettingsChange,
  onApplyRenames,
  onDownload,
  onStartOver,
}) => {
  const [keywordInput, setKeywordInput] = useState(settings.keywords.join(', '));
  const [hasApplied, setHasApplied] = useState(false);

  const requiredKeywords = useMemo(() => 
    calculateRequiredKeywords(images.length), 
    [images.length]
  );

  const keywords = useMemo(() => 
    keywordInput.split(',').map(k => k.trim()).filter(k => k.length > 0),
    [keywordInput]
  );

  const hasEnoughKeywords = keywords.length >= requiredKeywords;

  // Generate preview of new names
  const previewRenames = useMemo(() => {
    if (!hasEnoughKeywords) return new Map<string, string>();
    
    const permutations = getPermutations(keywords);
    const renames = new Map<string, string>();
    
    images.forEach((image, index) => {
      if (index < permutations.length) {
        const ext = getExtensionFromMimeType(image.currentFormat || image.format);
        const newName = permutations[index].join('_') + '.' + ext;
        renames.set(image.id, newName);
      }
    });
    
    return renames;
  }, [images, keywords, hasEnoughKeywords]);

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    const newKeywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    onSettingsChange({ keywords: newKeywords });
    setHasApplied(false);
  };

  const handleApplyRenames = () => {
    onApplyRenames(previewRenames);
    setHasApplied(true);
  };

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHeader}>
        <div className={styles.stepInfo}>
          <h3>Rename Images</h3>
          <p>Generate unique SEO-friendly filenames using keyword permutations</p>
        </div>
        <button className={styles.skipBtn} onClick={onDownload}>
          Skip & Download
        </button>
      </div>

      {/* How it works */}
      <div className={styles.renameExplainer}>
        <div className={styles.explainerIcon}>💡</div>
        <div className={styles.explainerContent}>
          <h4>How it works</h4>
          <p>
            Enter keywords separated by commas. The tool generates unique filenames by creating 
            all possible arrangements (permutations) of your keywords. For example, with keywords 
            "red, car, fast" you get: <code>red_car_fast.webp</code>, <code>red_fast_car.webp</code>, 
            <code>car_red_fast.webp</code>, etc.
          </p>
        </div>
      </div>

      {/* Keyword Input */}
      <div className={styles.settingsCard}>
        <div className={styles.keywordInputSection}>
          <div className={styles.keywordHeader}>
            <label htmlFor="keywords">Keywords</label>
            <span className={`${styles.keywordCount} ${hasEnoughKeywords ? styles.sufficient : styles.insufficient}`}>
              {keywords.length} / {requiredKeywords} required
            </span>
          </div>
          <input
            id="keywords"
            type="text"
            className={styles.keywordInput}
            placeholder="e.g., product, blue, modern, sale"
            value={keywordInput}
            onChange={(e) => handleKeywordChange(e.target.value)}
          />
          <p className={styles.keywordHint}>
            {hasEnoughKeywords 
              ? `✓ You have enough keywords for ${images.length} images (${keywords.length}! = ${getPermutations(keywords).length} combinations)`
              : `Need at least ${requiredKeywords} keywords to generate ${images.length} unique names`
            }
          </p>
        </div>
      </div>

      {/* Preview Table */}
      {hasEnoughKeywords && (
        <div className={styles.settingsCard}>
          <h4 className={styles.previewTitle}>Preview New Names</h4>
          <div className={styles.renamePreviewTable}>
            <div className={styles.renamePreviewHeader}>
              <span>Current Name</span>
              <span>→</span>
              <span>New Name</span>
            </div>
            <div className={styles.renamePreviewBody}>
              {images.map((image) => {
                const newName = previewRenames.get(image.id) || image.name;
                return (
                  <div key={image.id} className={styles.renamePreviewRow}>
                    <span className={styles.oldName}>{image.name}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.newName}>{newName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.stepActions}>
        <div className={styles.stepActionsLeft}>
          <button className={`${styles.actionBtn} ${styles.outline}`} onClick={onStartOver}>
            ↩️ Start Over
          </button>
        </div>
        <div className={styles.stepActionsRight}>
          {!hasApplied ? (
            <button
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={handleApplyRenames}
              disabled={!hasEnoughKeywords}
            >
              Apply Names & Download
            </button>
          ) : (
            <button className={`${styles.actionBtn} ${styles.success}`} onClick={onDownload}>
              ⬇️ Download ZIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
