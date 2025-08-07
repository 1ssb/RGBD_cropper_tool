# RGB-Depth Cropper v2.0.0

A modern, minimal Electron + React desktop app for interactively cropping RGB images and their corresponding depth maps with **integrated smart validation**, **reset functionality**, and **organized download structure**.

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
npm install rgb-depth-cropper-tool@2.0.0
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
- **Latest Version**: 2.0.0
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

1. **📷 Upload** your RGB image (PNG) and depth map (.npy) using the beautiful upload buttons
2. **🎯 Crop** interactively by clicking and dragging on the image
3. **✅ Watch Validation** - Real-time validation feedback shows crop status
4. **🔄 Move** existing crops by dragging inside the crop area
5. **🔄 Reset** crops or all data using the reset buttons
6. **💾 Download** organized ZIP with input and output folders

---

## ✨ New Features in v2.0.0

### 🔄 Reset Functionality
- **Reset Crop**: Clear current crop area (blue button)
- **Reset All**: Clear all uploaded images and depth data (red button)
- **Smart Positioning**: Reset buttons positioned in toolbar for easy access

### 📁 Organized Download Structure
- **Input Folder**: Contains original RGB and depth files
- **Output Folder**: Contains cropped RGB, depth, and metadata
- **Clean Organization**: `rgbd_crop_TIMESTAMP.zip` with proper folder structure

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
