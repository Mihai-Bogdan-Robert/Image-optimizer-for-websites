import { useImageProcessor } from './hooks/useImageProcessor';
import { DropZone } from './components/DropZone';
import { ResizeStep } from './components/ResizeStep';
import { CompressStep } from './components/CompressStep';
import { ConvertStep } from './components/ConvertStep';
import { RenameStep } from './components/RenameStep';
import { downloadAllAsZip } from './utils/downloadUtils';
import { formatFileSize } from './utils/imageProcessor';
import { APP_VERSION } from './utils/constants';
import type { WizardStep } from './types';
import styles from './App.module.css';

const STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: 'upload', label: 'Upload', number: 1 },
  { id: 'resize', label: 'Resize', number: 2 },
  { id: 'convert', label: 'Convert', number: 3 },
  { id: 'compress', label: 'Compress', number: 4 },
  { id: 'rename', label: 'Rename', number: 5 },
];

function App() {
  const {
    images,
    currentStep,
    setCurrentStep,
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
    setCompressSettings,
    setConvertSettings,
    setRenameSettings,
    applyRenames,
    removeImage,
    clearAllImages,
    resetToStart,
    createResizeGroup,
    updateResizeGroup,
    deleteResizeGroup,
    addImagesToGroup,
    removeImageFromGroup,
  } = useImageProcessor();

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canNavigateToStep = (stepId: WizardStep): boolean => {
    if (stepId === 'upload') return true;
    if (images.length === 0) return false;
    const targetIndex = STEPS.findIndex((s) => s.id === stepId);
    return targetIndex <= currentStepIndex + 1;
  };

  const handleStepClick = (stepId: WizardStep) => {
    if (canNavigateToStep(stepId) && !isProcessing) {
      setCurrentStep(stepId);
    }
  };

  const handleDownloadCurrent = async () => {
    await downloadAllAsZip(images, 'optimized-images');
  };

  // Calculate total sizes for the stats bar
  const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalCurrentSize = images.reduce((sum, img) => sum + (img.currentSize || img.originalSize), 0);
  const totalSaved = totalOriginalSize - totalCurrentSize;
  const averageFileSize = images.length > 0 ? totalCurrentSize / images.length : 0;
  const reductionPercentage = totalOriginalSize > 0 
    ? Math.round((totalSaved / totalOriginalSize) * 100) 
    : 0;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <DropZone
            images={images}
            onFilesAdded={addFiles}
            onRemoveImage={removeImage}
            onContinue={() => setCurrentStep('resize')}
          />
        );
      case 'resize':
        return (
          <ResizeStep
            images={images}
            resizeGroups={resizeGroups}
            isProcessing={isProcessing}
            progress={progress}
            onCreateGroup={createResizeGroup}
            onUpdateGroup={updateResizeGroup}
            onDeleteGroup={deleteResizeGroup}
            onAddImagesToGroup={addImagesToGroup}
            onRemoveImageFromGroup={removeImageFromGroup}
            onProcess={processResize}
            onSkip={() => setCurrentStep('convert')}
            onDownload={handleDownloadCurrent}
            onContinue={() => setCurrentStep('convert')}
          />
        );
      case 'convert':
        return (
          <ConvertStep
            images={images}
            settings={convertSettings}
            isProcessing={isProcessing}
            progress={progress}
            onSettingsChange={(s) => setConvertSettings((prev) => ({ ...prev, ...s }))}
            onProcess={processConvert}
            onSkip={() => setCurrentStep('compress')}
            onDownload={handleDownloadCurrent}
            onContinue={() => setCurrentStep('compress')}
          />
        );
      case 'compress':
        return (
          <CompressStep
            images={images}
            settings={compressSettings}
            isProcessing={isProcessing}
            progress={progress}
            onSettingsChange={(s) => setCompressSettings((prev) => ({ ...prev, ...s }))}
            onProcess={processCompress}
            onSkip={() => setCurrentStep('rename')}
            onDownload={handleDownloadCurrent}
            onContinue={() => setCurrentStep('rename')}
          />
        );
      case 'rename':
        return (
          <RenameStep
            images={images}
            settings={renameSettings}
            onSettingsChange={(s) => setRenameSettings((prev) => ({ ...prev, ...s }))}
            onApplyRenames={applyRenames}
            onDownload={handleDownloadCurrent}
            onStartOver={resetToStart}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="https://bammedia.ro/wp-content/uploads/Logo_Transparent_72ppi_-e1701034756165.png" alt="BAM Logo" className={styles.logoImg} />
          <h1>Image Optimizer</h1>
        </div>
        {images.length > 0 && (
          <div className={styles.headerActions}>
            <button className={styles.headerBtn} onClick={clearAllImages}>
              Clear All
            </button>
          </div>
        )}
      </header>

      <main className={styles.mainContent}>
        {images.length > 0 && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{images.length}</span>
              <span className={styles.statLabel}>IMAGES</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatFileSize(totalOriginalSize)}</span>
              <span className={styles.statLabel}>ORIGINAL SIZE</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatFileSize(totalCurrentSize)}</span>
              <span className={styles.statLabel}>CURRENT SIZE</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${totalSaved < 0 ? styles.statNegative : ''}`}>
                {totalSaved >= 0 ? formatFileSize(totalSaved) : `+${formatFileSize(Math.abs(totalSaved))}`}
              </span>
              <span className={styles.statLabel}>{totalSaved >= 0 ? 'SAVED' : 'INCREASED'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${reductionPercentage < 0 ? styles.statNegative : ''}`}>
                {reductionPercentage}%
              </span>
              <span className={styles.statLabel}>{reductionPercentage >= 0 ? 'REDUCTION' : 'INCREASE'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatFileSize(averageFileSize)}</span>
              <span className={styles.statLabel}>AVERAGE SIZE</span>
            </div>
          </div>
        )}

        <div className={styles.wizardContainer}>
          <div className={styles.stepIndicator}>
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isDisabled = !canNavigateToStep(step.id);

              return (
                <button
                  key={step.id}
                  className={`${styles.step} ${isActive ? styles.stepActive : ''} ${
                    isCompleted ? styles.stepCompleted : ''
                  } ${isDisabled ? styles.stepDisabled : ''}`}
                  onClick={() => handleStepClick(step.id)}
                  disabled={isDisabled || isProcessing}
                >
                  <span className={styles.stepNumber}>
                    {isCompleted ? '✓' : step.number}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.stepContent}>{renderStepContent()}</div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>🔒 All processing happens locally — your images never leave your device</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: '8px' }}>v{APP_VERSION}</p>
      </footer>
    </div>
  );
}

export default App;
