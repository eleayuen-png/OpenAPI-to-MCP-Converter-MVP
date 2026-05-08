import React from 'react';
import { Buffer } from 'buffer';

/**
 * TypeScript Global Extension
 * informs TypeScript that the 'window' object can hold the 'Buffer' property.
 */
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

/**
 * Polyfill for Buffer
 * Required for libraries like @apidevtools/swagger-parser to work in the browser.
 */
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

/**
 * Application Entry Point
 * * NOTE: The "Could not resolve" errors in the Preview window are expected 
 * because the browser editor cannot see your local filesystem. 
 * These paths are correct for your local Vite project structure.
 */
// @ts-ignore
import ReactDOM from 'react-dom/client';
import Root from './app/pages/Root'; 
// @ts-ignore
import './styles/theme.css'; 

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}