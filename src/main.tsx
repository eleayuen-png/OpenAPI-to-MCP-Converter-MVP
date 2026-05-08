import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';

/**
 * 1. THE POLYFILL (Must be at the absolute top)
 * This allows browser-based libraries like swagger-parser to function.
 */
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

/**
 * 2. IMPORTS
 * NOTE: The "Could not resolve" errors in this preview window are expected 
 * because this environment cannot access your local project's folder structure. 
 * These paths are correct for your local Vite project structure.
 */
import Root from './app/pages/Root'; 
import './styles/theme.css'; 

/**
 * 3. RENDERING
 * We must wrap <Root /> in <BrowserRouter> to provide context for 
 * React Router hooks like useLocation() used inside Root.tsx.
 */
const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </React.StrictMode>
  );
}