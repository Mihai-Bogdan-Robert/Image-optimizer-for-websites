import React, { useState } from 'react';
import type { ImageFile, ResizeGroup, PresetSize, ProcessingProgress } from '../types';
import { PRESET_SIZES } from '../utils/constants';
import { formatFileSize } from '../utils/imageProcessor';
import styles from './StepPanel.module.css';

interface ResizeStepProps {
  images: ImageFile[];
  resizeGroups: ResizeGroup[];
  isProcessing: boolean;
  progress: ProcessingProgress;
  onCreateGroup: (name: string, preset: PresetSize) => string;
  onUpdateGroup: (groupId: string, updates: Partial<ResizeGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddImagesToGroup: (groupId: string, imageIds: string[]) => void;
  onRemoveImageFromGroup: (groupId: string, imageId: string) => void;
  onProcess: () => void;
  onSkip: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

export const ResizeStep: React.FC<ResizeStepProps> = ({
  images,
  resizeGroups,
  isProcessing,
  progress,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddImagesToGroup,
  onRemoveImageFromGroup,
  onProcess,
  onSkip,
  onDownload,
  onContinue,
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAllPreview, setShowAllPreview] = useState(false);

  const hasProcessed = images.some((img) => img.currentBlob);
  
  // Get unassigned images (not in any group)
  const assignedImageIds = new Set(resizeGroups.flatMap((g) => g.imageIds));
  const unassignedImages = images.filter((img) => !assignedImageIds.has(img.id));

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const selectAllUnassigned = () => {
    setSelectedImages(new Set(unassignedImages.map((img) => img.id)));
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const handleCreateGroup = (preset: PresetSize) => {
    const name = newGroupName || PRESET_SIZES.find((p) => p.name === preset)?.label || 'Group';
    const groupId = onCreateGroup(name, preset);
    if (selectedImages.size > 0) {
      onAddImagesToGroup(groupId, Array.from(selectedImages));
      setSelectedImages(new Set());
    }
    setNewGroupName('');
    setShowCreateGroup(false);
  };

  const handleAddToGroup = (groupId: string) => {
    onAddImagesToGroup(groupId, Array.from(selectedImages));
    setSelectedImages(new Set());
  };

  const canProcess = resizeGroups.length > 0 && resizeGroups.some((g) => g.imageIds.length > 0);

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHeader}>
        <div className={styles.stepInfo}>
          <h3>Resize Images</h3>
          <p>Create groups with different sizes, then assign images to each group</p>
        </div>
        <button className={styles.skipBtn} onClick={onSkip}>
          Skip this step
        </button>
      </div>

      {/* Groups Section */}
      <div className={styles.settingsCard}>
        <div className={styles.groupsHeader}>
          <h4>Resize Groups</h4>
          <button 
            className={styles.addGroupBtn}
            onClick={() => setShowCreateGroup(!showCreateGroup)}
          >
            + Add Group
          </button>
        </div>

        {/* Create Group UI */}
        {showCreateGroup && (
          <div className={styles.createGroupPanel}>
            <input
              type="text"
              placeholder="Group name (optional)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={styles.groupNameInput}
            />
            <div className={styles.presetCards}>
              {PRESET_SIZES.map((preset) => (
                <div
                  key={preset.name}
                  className={styles.presetCard}
                  onClick={() => handleCreateGroup(preset.name)}
                >
                  <h4>{preset.label}</h4>
                  <p>{preset.width > 0 ? `${preset.width}×${preset.height}` : 'Original'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Groups */}
        {resizeGroups.length > 0 && (
          <div className={styles.groupsList}>
            {resizeGroups.map((group) => {
              const preset = PRESET_SIZES.find((p) => p.name === group.presetSize);
              const groupImages = images.filter((img) => group.imageIds.includes(img.id));
              
              return (
                <div key={group.id} className={styles.groupCard}>
                  <div className={styles.groupHeader}>
                    <div className={styles.groupInfo}>
                      <h5>{group.name}</h5>
                      <span className={styles.groupSize}>
                        {preset && preset.width > 0 ? `${preset.width}×${preset.height}` : 'No resize'}
                      </span>
                      <span className={styles.groupCount}>{groupImages.length} images</span>
                    </div>
                    <div className={styles.groupActions}>
                      {selectedImages.size > 0 && (
                        <button 
                          className={styles.assignBtn}
                          onClick={() => handleAddToGroup(group.id)}
                        >
                          + Add selected
                        </button>
                      )}
                      <button 
                        className={styles.deleteGroupBtn}
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Custom dimensions for custom preset */}
                  {group.presetSize === 'custom' && (
                    <>
                      <div className={styles.customDimensions}>
                        <input
                          type="number"
                          placeholder="Width"
                          value={group.customWidth || ''}
                          onChange={(e) => onUpdateGroup(group.id, { customWidth: parseInt(e.target.value) || 0 })}
                        />
                        <span>×</span>
                        <input
                          type="number"
                          placeholder="Height"
                          value={group.customHeight || ''}
                          onChange={(e) => onUpdateGroup(group.id, { customHeight: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <p className={styles.keywordHint}>
                        💡 If you only enter one dimension (width or height), that dimension will be limited to your value and the other will be scaled proportionally to maintain the original aspect ratio.
                      </p>
                    </>
                  )}

                  {/* Group Images */}
                  {groupImages.length > 0 && (
                    <div className={styles.groupImages}>
                      {groupImages.map((image) => (
                        <div key={image.id} className={styles.groupImageThumb}>
                          <img src={image.originalUrl} alt={image.name} />
                          <button 
                            className={styles.removeFromGroupBtn}
                            onClick={() => onRemoveImageFromGroup(group.id, image.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {resizeGroups.length === 0 && !showCreateGroup && (
          <p className={styles.noGroupsHint}>
            Click "Add Group" to create resize groups with different sizes
          </p>
        )}
      </div>

      {/* Unassigned Images */}
      {unassignedImages.length > 0 && (
        <div className={styles.settingsCard}>
          <div className={styles.unassignedHeader}>
            <h4>Unassigned Images ({unassignedImages.length})</h4>
            <div className={styles.selectionActions}>
              {selectedImages.size > 0 && (
                <span className={styles.selectedCount}>{selectedImages.size} selected</span>
              )}
              <button className={styles.selectBtn} onClick={selectAllUnassigned}>
                Select All
              </button>
              {selectedImages.size > 0 && (
                <button className={styles.selectBtn} onClick={clearSelection}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className={styles.unassignedGrid}>
            {unassignedImages.map((image) => (
              <div 
                key={image.id} 
                className={`${styles.selectableThumb} ${selectedImages.has(image.id) ? styles.selected : ''}`}
                onClick={() => toggleImageSelection(image.id)}
              >
                <img src={image.originalUrl} alt={image.name} />
                <div className={styles.selectCheckbox}>
                  {selectedImages.has(image.id) ? '✓' : ''}
                </div>
                <div className={styles.thumbName}>{image.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} />
          </div>
          <p className={styles.progressText}>
            Processing {progress.current} of {progress.total} images...
          </p>
        </div>
      )}

      {hasProcessed && (
        <div className={styles.previewGrid}>
          {(showAllPreview ? images : images.slice(0, 8)).map((image) => (
            <div key={image.id} className={styles.previewItem}>
              <div className={styles.previewImage}>
                <img src={image.currentUrl || image.originalUrl} alt={image.name} />
              </div>
              <div className={styles.previewInfo}>
                <div className={styles.previewName}>{image.name}</div>
                <div className={styles.previewStats}>
                  <span>{image.width}×{image.height}</span>
                  <span>{formatFileSize(image.currentSize || image.originalSize)}</span>
                </div>
              </div>
            </div>
          ))}
          {!showAllPreview && images.length > 8 && (
            <div 
              className={styles.previewItem} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                background: 'var(--color-gray-50)',
                border: '2px dashed var(--color-gray-300)'
              }}
              onClick={() => setShowAllPreview(true)}
            >
              <p style={{ 
                color: 'var(--color-primary)', 
                fontSize: '0.85rem', 
                fontWeight: '500',
                textAlign: 'center'
              }}>
                +{images.length - 8} more<br/>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Click to show all</span>
              </p>
            </div>
          )}
          {showAllPreview && images.length > 8 && (
            <div 
              className={styles.previewItem} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                background: 'var(--color-gray-50)',
                border: '2px dashed var(--color-gray-300)'
              }}
              onClick={() => setShowAllPreview(false)}
            >
              <p style={{ 
                color: 'var(--color-primary)', 
                fontSize: '0.85rem', 
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Show less<br/>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Click to collapse</span>
              </p>
            </div>
          )}
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
          {!hasProcessed ? (
            <button
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={onProcess}
              disabled={isProcessing || !canProcess}
            >
              {isProcessing ? 'Processing...' : 'Resize Images'}
            </button>
          ) : (
            <button className={`${styles.actionBtn} ${styles.success}`} onClick={onContinue}>
              Continue to Compress →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};