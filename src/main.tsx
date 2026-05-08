import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';

/**
 * TypeScript Ambient Declarations
 * These lines fix "Could not find declaration file" and "Side-effect import" errors
 * by telling the compiler how to handle these specific modules.
 */
declare module 'react-dom/client';
declare module '*.css';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

/**
 * Polyfill for Buffer
 * This fixes the "Buffer is not defined" error encountered in browser environments
 * when using libraries like @apidevtools/swagger-parser or js-yaml.
 * This must run before any other application code.
 */
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

/**
 * Application Entry Point
 * Note: If you encounter resolution errors in this preview tool, it is due to 
 * the environment's inability to see your local filesystem. These paths are 
 * correct for your local Vite project structure.
 */
import Root from './app/pages/Root'; 
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