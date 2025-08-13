import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import './RGBDepthCropper.css';

const RGBDepthCropper = () => {
  const [rgbImage, setRgbImage] = useState(null);
  const [depthData, setDepthData] = useState(null);
  const [cropArea, setCropArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState('create'); // 'create', 'move', 'resize'
  const [imageLoaded, setImageLoaded] = useState(false);
  const [depthLoaded, setDepthLoaded] = useState(false);
  const [error, setError] = useState('');
  const [validationStatus, setValidationStatus] = useState({
    isValid: false,
    issues: [],
    warnings: [],
    details: {}
  });

  // Global drag-and-drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      try {
        if (file.name.toLowerCase().endsWith('.png') ||
          file.name.toLowerCase().endsWith('.jpg') ||
          file.name.toLowerCase().endsWith('.jpeg')) {
          const dataUrl = await readFileAsDataURL(file);
          setRgbImage(dataUrl);
          setImageLoaded(true);
          setError('');
        } else if (file.name.toLowerCase().endsWith('.npy')) {
          const arrayBuffer = await readFileAsArrayBuffer(file);
          const parsedData = parseNpyFile(arrayBuffer);
          setDepthData(parsedData);
          setDepthLoaded(true);
          setError('');
        }
      } catch (err) {
        setError(`Error loading ${file.name}: ${err.message}`);
      }
    }
  }, []);

  // Register global drag-and-drop event listeners
  useEffect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDrop]);


  // Comprehensive validation system
  const runValidation = useCallback(() => {
    if (!imgElementRef.current || !depthData || !cropArea) {
      setValidationStatus({
        isValid: false,
        issues: ['No crop area defined or data not loaded'],
        warnings: [],
        details: {}
      });
      return;
    }

    const img = imgElementRef.current;
    const issues = [];
    const warnings = [];
    const details = {};

    // 1. Dimension validation
    const rgbWidth = img.naturalWidth;
    const rgbHeight = img.naturalHeight;
    let depthWidth, depthHeight;

    // Note: Depth data is stored as (height, width) but will be saved as (width, height) in NPY
    if (depthData.shape.length === 2) {
      [depthHeight, depthWidth] = depthData.shape;
    } else if (depthData.shape.length === 3 && depthData.shape[2] === 1) {
      [depthHeight, depthWidth] = depthData.shape.slice(0, 2);
    } else {
      issues.push('Unsupported depth data format');
    }

    details.originalDimensions = { width: rgbWidth, height: rgbHeight };
    details.depthDimensions = { width: depthWidth, height: depthHeight };

    if (rgbWidth !== depthWidth || rgbHeight !== depthHeight) {
      issues.push(`RGB and Depth dimensions do not match: RGB (${rgbWidth}x${rgbHeight}) vs Depth (${depthWidth}x${depthHeight})`);
    } else {
      details.dimensionsMatch = true;
    }

    // 2. Crop mathematics validation
    const cropRight = cropArea.x + cropArea.width;
    const cropBottom = cropArea.y + cropArea.height;

    details.cropBox = {
      x: Math.round(cropArea.x),
      y: Math.round(cropArea.y),
      width: Math.round(cropArea.width),
      height: Math.round(cropArea.height),
      right: Math.round(cropRight),
      bottom: Math.round(cropBottom)
    };

    if (cropArea.x < 0 || cropArea.y < 0) {
      issues.push('Crop coordinates are negative');
    }

    if (cropRight > rgbWidth || cropBottom > rgbHeight) {
      issues.push('Crop extends beyond image boundaries');
    }

    if (cropArea.width <= 0 || cropArea.height <= 0) {
      issues.push('Crop dimensions are invalid (zero or negative)');
    }

    // 3. Area percentage calculation
    const areaPercent = ((cropArea.width * cropArea.height) / (rgbWidth * rgbHeight)) * 100;
    details.areaPercent = Math.round(areaPercent * 100) / 100;

    if (areaPercent < 1) {
      warnings.push('Crop area is very small (< 1%)');
    } else if (areaPercent > 95) {
      warnings.push('Crop area is very large (> 95%)');
    }

    // 4. Cropped dimensions calculation
    const startY = Math.floor(cropArea.y);
    const endY = Math.min(Math.floor(cropArea.y + cropArea.height), rgbHeight);
    const startX = Math.floor(cropArea.x);
    const endX = Math.min(Math.floor(cropArea.x + cropArea.width), rgbWidth);
    const croppedHeight = endY - startY;
    const croppedWidth = endX - startX;

    details.croppedDimensions = { width: croppedWidth, height: croppedHeight };

    // 5. Border validation - check for 1-pixel differences
    const expectedWidth = Math.round(cropArea.width);
    const expectedHeight = Math.round(cropArea.height);
    const actualWidth = croppedWidth;
    const actualHeight = croppedHeight;

    details.borderValidation = {
      expected: { width: expectedWidth, height: expectedHeight },
      actual: { width: actualWidth, height: actualHeight },
      widthDiff: Math.abs(expectedWidth - actualWidth),
      heightDiff: Math.abs(expectedHeight - actualHeight)
    };

    // Enhanced border validation with mathematical precision
    const widthDiff = Math.abs(expectedWidth - actualWidth);
    const heightDiff = Math.abs(expectedHeight - actualHeight);

    if (widthDiff > 1) {
      issues.push(`CRITICAL: Width dimension mismatch - expected ${expectedWidth}, got ${actualWidth} (${widthDiff}px difference)`);
    } else if (widthDiff === 1) {
      warnings.push(`BORDER ADJUSTMENT: Width adjusted by 1px (${expectedWidth} → ${actualWidth})`);
    }

    if (heightDiff > 1) {
      issues.push(`CRITICAL: Height dimension mismatch - expected ${expectedHeight}, got ${actualHeight} (${heightDiff}px difference)`);
    } else if (heightDiff === 1) {
      warnings.push(`BORDER ADJUSTMENT: Height adjusted by 1px (${expectedHeight} → ${actualHeight})`);
    }

    // Additional mathematical consistency checks
    if (croppedWidth <= 0 || croppedHeight <= 0) {
      issues.push(`CRITICAL: Invalid cropped dimensions - ${croppedWidth} × ${croppedHeight}`);
    }

    if (croppedWidth > rgbWidth || croppedHeight > rgbHeight) {
      issues.push(`CRITICAL: Cropped dimensions exceed original image bounds`);
    }

    // Validate that crop coordinates are within bounds
    if (startX < 0 || startY < 0 || endX > rgbWidth || endY > rgbHeight) {
      issues.push(`CRITICAL: Crop coordinates extend beyond image boundaries`);
    }

    // 5. Data quality check
    if (depthData && depthData.data) {
      const totalPixels = depthData.data.length;
      const validPixels = depthData.data.filter(val => !isNaN(val) && isFinite(val)).length;
      const validPercentage = (validPixels / totalPixels) * 100;

      details.dataQuality = {
        totalPixels,
        validPixels,
        validPercentage: Math.round(validPercentage * 100) / 100
      };

      if (validPercentage < 90) {
        warnings.push(`Low depth data quality: ${validPercentage.toFixed(1)}% valid pixels`);
      }
    }

    // 6. NPY file compatibility check
    details.npyCompatibility = {
      headerFormat: 'Non-standard but functional',
      dataReadable: true
    };

    const isValid = issues.length === 0;

    setValidationStatus({
      isValid,
      issues,
      warnings,
      details
    });

  }, [depthData, cropArea]);

  // Run validation whenever crop area or depth data changes
  useEffect(() => {
    runValidation();
  }, [runValidation]);

  // Helper: Create properly formatted .npy file (Python 3 compatible)
  const createNpyFile = (data, shape) => {
    // Ensure shape is properly formatted for Python 3
    const shapeStr = shape.length === 1 ? `(${shape[0]},)` : `(${shape.join(', ')})`;
    const header = `{'descr': '<f4', 'fortran_order': False, 'shape': ${shapeStr}}`;
    const headerWithNewline = header + '\n';
    const headerLen = headerWithNewline.length;

    // Calculate padding to make total header length a multiple of 16
    const totalHeaderSize = 10 + headerLen; // magic(6) + version(2) + headerLen(2) + header
    const padding = (16 - (totalHeaderSize % 16)) % 16;
    const paddedHeader = headerWithNewline + ' '.repeat(padding);
    const finalHeaderLen = paddedHeader.length;

    const magic = new Uint8Array([0x93, 0x4E, 0x55, 0x4D, 0x50, 0x59]); // \x93NUMPY
    const version = new Uint8Array([0x01, 0x00]); // v1.0 (Python 3 compatible)
    const headerLenBytes = new Uint8Array(2);
    new DataView(headerLenBytes.buffer).setUint16(0, finalHeaderLen, true);

    const headerBytes = new TextEncoder().encode(paddedHeader);
    const buffer = new Uint8Array(10 + finalHeaderLen + data.byteLength);

    buffer.set(magic, 0);
    buffer.set(version, 6);
    buffer.set(headerLenBytes, 8);
    buffer.set(headerBytes, 10);

    // Properly copy the Float32Array data without corruption
    const dataUint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    buffer.set(dataUint8, 10 + finalHeaderLen);

    return buffer;
  };

  const canvasRef = useRef(null);
  const imgElementRef = useRef(null);

  // Helper: Read file as ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper: Read file as DataURL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // .npy parser
  const parseNpyFile = (buffer) => {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(view.getUint8(0)) +
      String.fromCharCode(view.getUint8(1)) +
      String.fromCharCode(view.getUint8(2)) +
      String.fromCharCode(view.getUint8(3)) +
      String.fromCharCode(view.getUint8(4)) +
      String.fromCharCode(view.getUint8(5));
    if (magic !== '\x93NUMPY') throw new Error('Not a valid .npy file');
    const headerLen = view.getUint16(8, true);
    const headerBytes = new Uint8Array(buffer, 10, headerLen);
    const header = new TextDecoder().decode(headerBytes);
    const shapeMatch = header.match(/'shape':\s*\(([^)]+)\)/);
    const dtypeMatch = header.match(/'descr':\s*'([^']+)'/);
    if (!shapeMatch || !dtypeMatch) throw new Error('Could not parse .npy header');
    const shape = shapeMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const dtype = dtypeMatch[1];
    const dataStart = 10 + headerLen;
    const dataBuffer = buffer.slice(dataStart);
    let data;
    if (dtype.includes('f4') || dtype.includes('float32')) {
      data = new Float32Array(dataBuffer);
    } else if (dtype.includes('f8') || dtype.includes('float64')) {
      data = new Float64Array(dataBuffer);
    } else if (dtype.includes('i4') || dtype.includes('int32')) {
      data = new Int32Array(dataBuffer);
    } else if (dtype.includes('u1') || dtype.includes('uint8')) {
      data = new Uint8Array(dataBuffer);
    } else {
      data = new Float32Array(dataBuffer);
    }
    return { data, shape, dtype };
  };

  // File upload handlers
  const handleRGBUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setRgbImage(dataUrl);
      setImageLoaded(true);
      setError('');
    } catch (err) {
      setError('Error loading RGB image: ' + err.message);
    }
  };

  const handleDepthUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const parsedData = parseNpyFile(arrayBuffer);
      setDepthData(parsedData);
      setDepthLoaded(true);
      setError('');
    } catch (err) {
      setError('Error loading depth.npy: ' + err.message);
    }
  };

  // Enhanced crop logic with move and resize functionality
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Check if mouse is inside existing crop area
  const isInsideCropArea = (pos) => {
    if (!cropArea) return false;
    return pos.x >= cropArea.x &&
      pos.x <= cropArea.x + cropArea.width &&
      pos.y >= cropArea.y &&
      pos.y <= cropArea.y + cropArea.height;
  };

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;
    const pos = getMousePos(e);

    if (cropArea && isInsideCropArea(pos)) {
      // Click inside existing crop area - move mode
      setDragMode('move');
      setIsDragging(true);
      setDragStart({
        x: pos.x - cropArea.x,
        y: pos.y - cropArea.y
      });
    } else {
      // Click outside crop area - create new crop
      setDragMode('create');
      setIsDragging(true);
      setDragStart(pos);
      setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageLoaded) return;
    const pos = getMousePos(e);
    const canvas = canvasRef.current;

    if (dragMode === 'move' && cropArea) {
      // Move existing crop area
      const newX = Math.max(0, Math.min(pos.x - dragStart.x, canvas.width - cropArea.width));
      const newY = Math.max(0, Math.min(pos.y - dragStart.y, canvas.height - cropArea.height));

      setCropArea({
        ...cropArea,
        x: newX,
        y: newY
      });
    } else if (dragMode === 'create') {
      // Create new crop area
      setCropArea({
        x: Math.min(dragStart.x, pos.x),
        y: Math.min(dragStart.y, pos.y),
        width: Math.abs(pos.x - dragStart.x),
        height: Math.abs(pos.y - dragStart.y)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode('create');
  };

  // Enhanced cursor styling based on interaction
  const getCursor = (e) => {
    if (!imageLoaded) return 'default';
    if (isDragging) return dragMode === 'move' ? 'move' : 'crosshair';

    const pos = getMousePos(e);
    if (cropArea && isInsideCropArea(pos)) {
      return 'move';
    }
    return 'crosshair';
  };

  const handleMouseMoveForCursor = (e) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = getCursor(e);
    }
  };

  const clearCrop = () => {
    setCropArea(null);
  };

  // Reset all images and depth data
  const resetAll = () => {
    setRgbImage(null);
    setDepthData(null);
    setCropArea(null);
    setImageLoaded(false);
    setDepthLoaded(false);
    setError('');
    setValidationStatus({
      isValid: false,
      issues: [],
      warnings: [],
      details: {}
    });
  };

  // Draw image and overlay (crop interior = image, exterior = dark overlay, border = visible, NO white box)
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgElementRef.current;
    if (!canvas || !img || !imageLoaded) return;

    // Set canvas to natural image dimensions to preserve aspect ratio
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (cropArea) {
      ctx.save();
      // Draw dark overlay everywhere
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Redraw the image only inside the crop area
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height
      );
      // Draw crop rectangle border (colored, not white)
      ctx.strokeStyle = '#00c6ff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [cropArea, imageLoaded]);

  useEffect(() => { drawImage(); }, [drawImage]);



  // Download everything as a ZIP with proper structure
  const downloadCropped = async () => {
    if (!cropArea || !imageLoaded || !depthLoaded || !depthData) return;

    // Use comprehensive validation
    if (!validationStatus.isValid) {
      setError('Validation failed: ' + validationStatus.issues.join(', '));
      return;
    }

    try {
      // Generate timestamp for folder name
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-MM-SS
      const folderName = `rgbd_crop_${timestamp}`;

      // --- Create RGB PNG ---
      const canvas = document.createElement('canvas');
      const img = imgElementRef.current;

      // Use exact same dimensions for both RGB and depth
      const startY = Math.floor(cropArea.y);
      const endY = Math.min(Math.floor(cropArea.y + cropArea.height), img.naturalHeight);
      const startX = Math.floor(cropArea.x);
      const endX = Math.min(Math.floor(cropArea.x + cropArea.width), img.naturalWidth);
      const croppedHeight = endY - startY;
      const croppedWidth = endX - startX;

      canvas.width = croppedWidth;
      canvas.height = croppedHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        startX, startY, croppedWidth, croppedHeight,
        0, 0, croppedWidth, croppedHeight
      );
      const rgbBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      // --- Create Depth NPY with proper format ---
      const { data, shape } = depthData;
      let [height, width] = shape;
      if (shape.length === 3 && shape[2] === 1) {
        width = shape[1];
        height = shape[0];
      }

      // Extract cropped depth data in original format
      const croppedData = new Float32Array(croppedHeight * croppedWidth);
      for (let y = 0; y < croppedHeight; y++) {
        for (let x = 0; x < croppedWidth; x++) {
          const srcIdx = (startY + y) * width + (startX + x);
          const dstIdx = y * croppedWidth + x;
          croppedData[dstIdx] = data[srcIdx];
        }
      }

      // Create proper .npy file using the helper function
      // Note: Using original (height, width) format to avoid data corruption
      const depthBuffer = createNpyFile(croppedData, [croppedHeight, croppedWidth]);
      const depthBlob = new Blob([depthBuffer], { type: 'application/octet-stream' });

      // --- Create Metadata JSON ---
      const metadata = {
        originalDimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight
        },
        cropBox: {
          x: Math.round(cropArea.x),
          y: Math.round(cropArea.y),
          width: croppedWidth,
          height: croppedHeight,
          right: Math.round(cropArea.x) + croppedWidth,
          bottom: Math.round(cropArea.y) + croppedHeight
        },
        croppedFrom: {
          top: Math.round(cropArea.y),
          right: Math.round(img.naturalWidth - (cropArea.x + croppedWidth)),
          bottom: Math.round(img.naturalHeight - (cropArea.y + croppedHeight)),
          left: Math.round(cropArea.x)
        },
        remainingArea: {
          widthPercent: Math.round((croppedWidth / img.naturalWidth) * 100) / 100,
          heightPercent: Math.round((croppedHeight / img.naturalHeight) * 100) / 100,
          areaPercent: Math.round(((croppedWidth * croppedHeight) / (img.naturalWidth * img.naturalHeight)) * 100 * 100) / 100
        },
        timestamp: now.toISOString(),
        folderName: folderName
      };

      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      });

      // --- Create ZIP using JSZip with proper folder structure ---
      const zip = new JSZip();

      // Create original folder with original files
      const originalFolder = zip.folder('original');

      // Add original RGB image to original folder
      const originalRgbResponse = await fetch(rgbImage);
      const originalRgbBlob = await originalRgbResponse.blob();
      originalFolder.file('rgb.png', originalRgbBlob);

      // Add original depth.npy to original folder (use the original depth data)
      const originalDepthBuffer = createNpyFile(data, shape);
      const originalDepthBlob = new Blob([originalDepthBuffer], { type: 'application/octet-stream' });
      originalFolder.file('depth.npy', originalDepthBlob);

      // Create crop folder with cropped files
      const cropFolder = zip.folder('crop');
      cropFolder.file('rgb.png', rgbBlob);
      cropFolder.file('depth.npy', depthBlob);
      cropFolder.file('crop_metadata.json', metadataBlob);

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setError('');
    } catch (err) {
      setError('Error creating ZIP download: ' + err.message);
      console.error('Download error:', err);
    }
  };

  // Exit button
  const handleExit = () => {
    if (window && window.close) window.close();
    else if (window && window.electronAPI && window.electronAPI.exit) window.electronAPI.exit();
    else window.location.href = 'about:blank';
  };

  return (
    <div className="rgbd-root">
      <div className="rgbd-card">
        <h1 className="rgbd-title">RGB-Depth Cropper</h1>
        {error && <div className="rgbd-error">{error}</div>}
        <div className="rgbd-toolbar">
          <div className="rgbd-upload-section">
            <div className="rgbd-upload-group">
              <label className="rgbd-upload-label">
                <input
                  className="rgbd-file-input"
                  type="file"
                  accept="image/png"
                  onChange={handleRGBUpload}
                />
                <div className="rgbd-upload-btn rgbd-upload-rgb">
                  <span className="rgbd-upload-icon">📷</span>
                  <span className="rgbd-upload-text">
                    {imageLoaded ? 'RGB Image Loaded' : 'Upload RGB Image'}
                  </span>
                  <span className="rgbd-upload-format">PNG</span>
                </div>
              </label>
            </div>
            <div className="rgbd-upload-group">
              <label className="rgbd-upload-label">
                <input
                  className="rgbd-file-input"
                  type="file"
                  accept=".npy"
                  onChange={handleDepthUpload}
                />
                <div className="rgbd-upload-btn rgbd-upload-depth">
                  <span className="rgbd-upload-icon">🗺️</span>
                  <span className="rgbd-upload-text">
                    {depthLoaded ? 'Depth Map Loaded' : 'Upload Depth Map'}
                  </span>
                  <span className="rgbd-upload-format">NPY</span>
                </div>
              </label>
            </div>
          </div>
          <div className="rgbd-toolbar-buttons">
            <div className="rgbd-button-stack">
              <button
                onClick={resetAll}
                disabled={!imageLoaded && !depthLoaded}
                className="rgbd-btn rgbd-btn-reset-all"
                title="Clear all images and depth data"
              >
                <RotateCcw size={14} />
                <span>Reset All</span>
              </button>
              <button
                onClick={clearCrop}
                disabled={!cropArea}
                className="rgbd-btn rgbd-btn-reset-crop"
                title="Clear current crop area"
              >
                <RotateCcw size={14} />
                <span>Reset Crop</span>
              </button>
            </div>
          </div>
        </div>
        {/* Image Container - Full Width */}
        <div className="rgbd-canvas-container">
          <canvas
            ref={canvasRef}
            className="rgbd-canvas"
            style={{ display: rgbImage ? 'block' : 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handleMouseMoveForCursor(e);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <img
            ref={imgElementRef}
            src={rgbImage || ''}
            alt="RGB"
            style={{ display: 'none' }}
            onLoad={() => setImageLoaded(true)}
          />
          {!rgbImage && <div className="rgbd-placeholder">Upload RGB image to begin</div>}
        </div>

        {/* Crop Info Display - Fixed Position Below Image */}
        {cropArea && (
          <div className="rgbd-crop-info-fixed">
            Crop Area: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px at ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
          </div>
        )}

        {/* Status and Controls - Below Image */}
        <div className="rgbd-controls-section">
          <div className="rgbd-status">
            <div><b>Status:</b></div>
            <div className={imageLoaded ? 'ok' : 'not'}>RGB: {imageLoaded ? 'Loaded' : 'Not loaded'}</div>
            <div className={depthLoaded ? 'ok' : 'not'}>Depth: {depthLoaded ? 'Loaded' : 'Not loaded'}</div>
            {depthData && <div className="shape">Depth Shape: {depthData.shape.join(' × ')}</div>}
            {imageLoaded && depthLoaded && imgElementRef.current && (
              <div className={validationStatus.details?.dimensionsMatch ? 'ok' : 'error'}>
                {validationStatus.details?.dimensionsMatch
                  ? 'Dimensions: Match ✓'
                  : `Dimensions: Do not match ✗ (RGB: ${imgElementRef.current.naturalWidth}×${imgElementRef.current.naturalHeight}, Depth: ${validationStatus.details?.depthDimensions?.width || depthData.shape[1]}×${validationStatus.details?.depthDimensions?.height || depthData.shape[0]})`
                }
              </div>
            )}
          </div>

          {/* Robust Validation Status Display */}
          {cropArea && (imageLoaded || depthLoaded) && (
            <div className={`rgbd-validation ${validationStatus.isValid ? 'valid' : 'invalid'}`}>
              <div className="validation-header">
                <div className={`validation-status-indicator ${validationStatus.isValid ? 'valid' : 'invalid'}`}></div>
                {validationStatus.isValid ? (
                  <CheckCircle size={18} className="valid-icon" />
                ) : (
                  <AlertCircle size={18} className="invalid-icon" />
                )}
                <span className="validation-title">
                  {validationStatus.isValid ? 'DIMENSIONS CHECK PASSED' : 'DIMENSIONS ISSUES DETECTED'}
                </span>
              </div>

              {validationStatus.issues.length > 0 && (
                <div className="validation-issues">
                  <strong style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                    🚨 CRITICAL ISSUES:
                  </strong>
                  {validationStatus.issues.map((issue, index) => (
                    <div key={index} className="issue-item">• {issue}</div>
                  ))}
                </div>
              )}

              {validationStatus.warnings.length > 0 && (
                <div className="validation-warnings">
                  <strong style={{ color: '#e65100', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                    ⚠️ WARNINGS:
                  </strong>
                  {validationStatus.warnings.map((warning, index) => (
                    <div key={index} className="warning-item">• {warning}</div>
                  ))}
                </div>
              )}

              {validationStatus.details && (
                <div className="validation-details">
                  <strong style={{ color: '#1a1a1a', fontSize: '13px', marginBottom: '8px', display: 'block', textAlign: 'center' }}>
                    📊 CROP METADATA
                  </strong>
                  <div className="detail-item">
                    <span className="detail-label">Crop Area:</span>
                    <span className="detail-value">{validationStatus.details.areaPercent}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Data Quality:</span>
                    <span className="detail-value">{validationStatus.details.dataQuality?.validPercentage}%</span>
                  </div>
                  {validationStatus.details.borderValidation && (
                    <>
                      <div className="detail-item">
                        <span className="detail-label">Expected Size:</span>
                        <span className="detail-value">
                          {validationStatus.details.borderValidation.expected.width} × {validationStatus.details.borderValidation.expected.height}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Actual Size:</span>
                        <span className="detail-value">
                          {validationStatus.details.borderValidation.actual.width} × {validationStatus.details.borderValidation.actual.height}
                        </span>
                      </div>
                      {(validationStatus.details.borderValidation.widthDiff > 0 || validationStatus.details.borderValidation.heightDiff > 0) && (
                        <div className="detail-item">
                          <span className="detail-label">Border Adjust:</span>
                          <span className="detail-value" style={{ color: validationStatus.details.borderValidation.widthDiff > 1 || validationStatus.details.borderValidation.heightDiff > 1 ? '#d32f2f' : '#ff9800' }}>
                            {validationStatus.details.borderValidation.widthDiff}px × {validationStatus.details.borderValidation.heightDiff}px
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {validationStatus.details.originalDimensions && (
                    <div className="detail-item">
                      <span className="detail-label">Original:</span>
                      <span className="detail-value">
                        {validationStatus.details.originalDimensions.width} × {validationStatus.details.originalDimensions.height}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="rgbd-action-buttons">
            <button
              onClick={downloadCropped}
              disabled={!cropArea || !imageLoaded || !depthLoaded || !validationStatus.isValid}
              className={`rgbd-btn rgbd-btn-download ${validationStatus.isValid ? 'valid' : 'invalid'}`}
              title={validationStatus.isValid ?
                'Download cropped RGB, depth, and metadata as ZIP with input files' :
                `Validation issues: ${validationStatus.issues.join(', ')}`
              }
            >
              <Download size={22} />
              <span>
                {validationStatus.isValid ?
                  '✅ Download ZIP (Original + Crop + Metadata)' :
                  `❌ Fix ${validationStatus.issues.length} Issue${validationStatus.issues.length !== 1 ? 's' : ''}`
                }
              </span>
            </button>
          </div>
        </div>
        <div className="rgbd-footer">
          <p className="rgbd-copyright">
            © {new Date().getFullYear()} <a href="https://1ssb.github.io" target="_blank" rel="noopener noreferrer">Subhransu S. Bhattacharjee</a>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RGBDepthCropper;

