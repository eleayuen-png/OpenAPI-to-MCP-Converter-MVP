import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

/**
 * 1. THE POLYFILL (Must be at the absolute top)
 * Required for browser-based libraries like @apidevtools/swagger-parser.
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
 * NOTE: The "Could not resolve" errors appearing in this preview window 
 * are expected because this online environment cannot see your local 
 * folder structure. These paths are correct for your local Vite project.
 */
// @ts-ignore
import Root from './app/pages/Root';
// @ts-ignore
import Upload from './app/pages/Upload';
// @ts-ignore
import Prune from './app/pages/Prune';
// @ts-ignore
import MacroTools from './app/pages/MacroTools'; 
// @ts-ignore
import Auth from './app/pages/Auth';
// @ts-ignore
import Deploy from './app/pages/Deploy';
// @ts-ignore
import Logs from './app/pages/Logs';
// @ts-ignore
import './styles/theme.css'; 

/**
 * 3. RENDERING & ROUTING
 * Using absolute paths for child routes to ensure reliable matching across all steps.
 */
const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />}>
            {/* Landing/Step 1 */}
            <Route index element={<Upload />} />
            
            {/* Wizard Steps */}
            <Route path="/prune" element={<Prune />} />
            <Route path="/macro-tools" element={<MacroTools />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/deploy" element={<Deploy />} />
            
            {/* Utilities */}
            <Route path="/logs" element={<Logs />} />

            {/* Safety Catch-all: Redirects any unknown route back to Upload */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}