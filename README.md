# RGB-Depth Cropper v2.5.0

A modern, minimal Electron + React desktop app for interactively cropping RGB images and their corresponding depth maps with **integrated smart validation**, **drag-and-drop support**, **reset functionality**, and **organized download structure**.

## 🚀 Quick Start

### Option 1: Install from NPM (Recommended)

```bash
npm install -g rgb-depth-cropper-tool
rgb-depth-cropper
```

### Option 2: Local Development

```bash
git clone https://github.com/1ssb/RGBD_cropper_tool.git
cd RGBD_cropper_tool
npm install
npm run build
npm start
```

## 📦 NPM Package Usage

### Installation

```bash
# Install globally (recommended)
npm install -g rgb-depth-cropper-tool

# Or install locally
npm install rgb-depth-cropper-tool

# Or use the exact version
npm install rgb-depth-cropper-tool@2.5.0
```

### Running the App

```bash
# If installed globally
rgb-depth-cropper

# If installed locally
npx rgb-depth-cropper
```

### Package Information

- **Package Name**: `rgb-depth-cropper-tool`
- **Command**: `rgb-depth-cropper`
- **Latest Version**: 2.5.0
- **License**: Custom (requires citation)
- **Platform**: Cross-platform (Windows, macOS, Linux)

### System Requirements

- Node.js >= 16.0.0
- NPM >= 6.0.0
- Graphics display (for GUI)

### Linux Users

If you encounter sandbox permission errors on Linux, run:

```bash
sudo chown root:root $(npm root -g)/rgb-depth-cropper-tool/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 $(npm root -g)/rgb-depth-cropper-tool/node_modules/electron/dist/chrome-sandbox
```

## Usage

1. **📷 Upload** your RGB image (PNG) and depth map (.npy) using the beautiful upload buttons or **drag-and-drop** files anywhere in the window
2. **🎯 Crop** interactively by clicking and dragging on the image
3. **✅ Watch Validation** - Real-time validation feedback shows crop status
4. **🔄 Move** existing crops by dragging inside the crop area
5. **🔄 Reset** crops or all data using the reset buttons
6. **💾 Download** organized ZIP with original and crop folders

---

## ✨ New Features in v2.5.0

### 🎯 Global Drag-and-Drop Support
- **Drop Anywhere**: Drag and drop files anywhere in the application window
- **Multiple Formats**: Supports RGB images (.png, .jpg, .jpeg) and depth maps (.npy)
- **Smart Detection**: Automatically detects file types and loads them appropriately
- **Error Handling**: Proper error messages for unsupported files

### 🔧 Fixed Dimension Display Bug
- **Accurate Validation**: Proper dimension matching between RGB and depth images
- **Correct Display**: No more false "dimensions don't match" errors
- **Real-time Updates**: Dimension validation updates as you load files

### 🔄 Enhanced Reset Functionality
- **Complete State Cleanup**: Proper cleanup of all states and references
- **Canvas Reset**: Clears canvas dimensions and context properly
- **Image Reference Cleanup**: Resets image element sources and handlers
- **Validation Reset**: Clears validation status to prevent stale data

### 📁 Updated Download Structure
- **Original Folder**: Contains source RGB and depth files
- **Crop Folder**: Contains cropped RGB, depth, and metadata
- **Updated Labels**: Download button shows "Original + Crop + Metadata"
- **Clean Organization**: `rgbd_crop_TIMESTAMP.zip` with improved folder structure

### 📊 Enhanced Status Display
- **Immediate Dimension Check**: Shows dimension mismatch directly in status
- **Clear Visual Indicators**: Green checkmarks for matches, red X for mismatches
- **Fixed Crop Info**: Crop area displayed below image in fixed position

### 🎨 Improved User Experience
- **Better Button Layout**: Horizontal arrangement for reset buttons
- **Color-Coded Actions**: Red for destructive, blue for safe operations
- **Enhanced Validation**: More direct error messages and status updates

---

## Validation System

The app includes an **integrated validation system** that provides real-time feedback:

- **Dimension Alignment**: Ensures RGB and depth dimensions match perfectly
- **Crop Mathematics**: Validates crop boundaries and calculations
- **Area Percentage**: Calculates and displays crop area percentage
- **Data Quality**: Checks depth data validity and quality
- **Visual Feedback**: Green checkmarks for valid, red alerts for issues
- **Smart Download**: Button changes color and text based on validation status

---

## A common Linux Sandbox Issue

**If you encounter this error on Linux:**

```
FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:169] The SUID sandbox helper binary was found, but is not configured correctly.
```

**Fix it with:**

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

This is a common Electron security feature on Linux systems.

---

## 📁 Project Structure

```text
project-root/
├── index.html           # App entry point
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── package.json         # Project metadata and scripts
├── renderer.js          # React entry point
├── webpack.config.js    # Webpack config for React
├── .babelrc             # Babel config for JSX/ES6
├── src/
│   ├── RGBDepthCropper.js # Main React component with validation
│   └── RGBDepthCropper.css # Component styles
└── dist/                # Build output (webpack)
    └── renderer.js        # Compiled React bundle
```

## License

This project uses a custom license that **requires citation** when used in research or publications. See [LICENSE](./LICENSE) for full details.

**For questions or improvements, open an issue or PR.**
