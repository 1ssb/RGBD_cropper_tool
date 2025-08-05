#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Make launcher.js executable
const launcherJsPath = path.join(__dirname, 'launcher.js');
try {
    fs.chmodSync(launcherJsPath, '755');

    // Fix Electron sandbox on Linux
    const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist');
    const sandboxPath = path.join(electronPath, 'chrome-sandbox');

    if (fs.existsSync(sandboxPath)) {
        try {
            execSync(`sudo chown root:root "${sandboxPath}"`, { stdio: 'ignore' });
            execSync(`sudo chmod 4755 "${sandboxPath}"`, { stdio: 'ignore' });
            console.log('🔧 Electron sandbox configured for Linux');
        } catch (sandboxError) {
            console.log('⚠️  Note: If you encounter sandbox errors on Linux, run:');
            console.log('   sudo chown root:root node_modules/electron/dist/chrome-sandbox');
            console.log('   sudo chmod 4755 node_modules/electron/dist/chrome-sandbox');
        }
    }

    console.log('✅ RGB-Depth Cropper Tool installed successfully!');
    console.log('📝 Usage: rgb-depth-cropper');
    console.log('💡 Note: The app is pre-built and ready to use!');
} catch (error) {
    console.error('❌ Error during installation:', error.message);
} 