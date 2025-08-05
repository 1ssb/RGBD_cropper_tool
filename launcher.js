#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Find the electron binary
let electronPath;
try {
    // Try to get electron path from require
    const electronModule = require('electron');
    if (typeof electronModule === 'string') {
        electronPath = electronModule;
    } else {
        // If it's a module, try to find the binary
        electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron');
    }
} catch (error) {
    // Fallback to global electron
    electronPath = 'electron';
}

// Spawn electron process with the main.js file
const electronProcess = spawn(electronPath, [path.join(__dirname, 'main.js')], {
    stdio: 'inherit',
    cwd: __dirname
});

electronProcess.on('error', (error) => {
    console.error('Failed to start Electron:', error.message);
    process.exit(1);
});

electronProcess.on('close', (code) => {
    process.exit(code);
}); 