import React from 'react';
import { createRoot } from 'react-dom/client';
import RGBDepthCropper from './src/RGBDepthCropper';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const container = document.getElementById('root');
        if (!container) {
            throw new Error('Could not find root element');
        }
        console.log('Found root element, initializing React');
        
        const root = createRoot(container);
        console.log('Created React root');
        
        root.render(
            <React.StrictMode>
                <RGBDepthCropper />
            </React.StrictMode>
        );
        console.log('Rendered RGBDepthCropper component');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Show error on page
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; font-family: sans-serif;">
                <h2>Failed to initialize application</h2>
                <pre>${error.message}</pre>
            </div>
        `;
    }
});
