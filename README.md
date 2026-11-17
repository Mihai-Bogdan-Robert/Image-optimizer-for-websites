# Image Optimizer

A powerful React-based image optimization tool that runs entirely in your browser. Compress, resize, and convert your images with an intuitive wizard-style interface — no server uploads required!

## Features

### 🧙 Wizard-Style Interface
Step through the optimization process with a clean, guided workflow:
1. **Upload** → 2. **Resize** → 3. **Compress** → 4. **Convert**

At each step, you can:
- Skip the step if not needed
- Process and download results
- Continue to the next optimization step

### Upload System
- ✅ **Drag & Drop** - Simply drag images onto the drop zone
- ✅ **Multi-file Upload** - Select multiple images at once
- ✅ **Folder Upload** - Upload entire folders of images

### Image Resizing (Step 2)
- ✅ **Predefined Presets**:
  - Hero (1920×1080) - Full-width banners
  - Product (800×800) - E-commerce images
  - Thumbnail (300×300) - Small previews
  - Normal (1200×800) - Standard web images
  - Custom dimensions
- ✅ **Aspect Ratio Preservation** - Maintain original proportions
- ✅ **No Upscaling** - Images are never enlarged beyond original size

### Image Compression (Step 3)
- ✅ **Lossy & Lossless Compression** - Full control over compression mode
- ✅ **Auto-optimization** - Automatic best-quality-to-size detection
- ✅ **Quality Control** - Adjustable compression quality (1-100)
- ✅ **Metadata Stripping** - Remove EXIF and other metadata

### Format Conversion (Step 4)
- ✅ **WebP Conversion** - Convert images to WebP for optimal web performance
- ✅ **Format Options** - Choose WebP, JPEG, PNG, or keep original format
- ✅ **SVG Preservation** - SVG files are preserved in their original format

### Privacy
- 🔒 **100% Client-side** - All processing happens locally in your browser
- 🔒 **No Server Uploads** - Your images never leave your device

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **browser-image-compression** for image processing
- **JSZip** for ZIP file generation
- **CSS Modules** for scoped styling

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server runs at `http://localhost:5173` with hot module replacement.

## Project Structure

```
src/
├── components/          # React components
│   ├── DropZone.tsx    # Upload step with drag & drop
│   ├── ResizeStep.tsx  # Resize wizard step
│   ├── CompressStep.tsx # Compression wizard step
│   └── ConvertStep.tsx # Format conversion wizard step
├── hooks/
│   └── useImageProcessor.ts # State management & processing logic
├── utils/
│   ├── imageProcessor.ts    # Image processing utilities
│   ├── downloadUtils.ts     # Download and ZIP utilities
│   └── constants.ts         # Preset sizes and defaults
├── types/
│   └── index.ts        # TypeScript type definitions
├── App.tsx             # Main application with wizard navigation
└── main.tsx            # Application entry point
```

## Usage

1. **Upload**: Drag and drop images or select files/folders
2. **Resize**: Choose a preset size or enter custom dimensions (or skip)
3. **Compress**: Select compression mode and quality (or skip)
4. **Convert**: Choose output format and download your optimized images

## Browser Support

Works in all modern browsers that support:
- Canvas API
- Web Workers
- File API
- ES2020+

## License

MIT
