import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router';

/**
 * 1. THE POLYFILL (Must be at the absolute top)
 * Provides Buffer support in the browser environment.
 */
declare global {
  interface Window {
    Buffer: any;
  }
}

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

/**
 * 2. IMPORTS
 * Added explicit .tsx and .css extensions to resolve build issues.
 */
// @ts-ignore
import Root from './app/pages/Root.tsx';
// @ts-ignore
import Upload from './app/pages/Upload.tsx';
// @ts-ignore
import Prune from './app/pages/Prune.tsx';
// @ts-ignore
import MacroTools from './app/pages/MacroTools.tsx'; 
// @ts-ignore
import Auth from './app/pages/Auth.tsx';
// @ts-ignore
import Deploy from './app/pages/Deploy.tsx';
// @ts-ignore
import Logs from './app/pages/Logs.tsx';
// @ts-ignore
import './styles/theme.css'; 

/**
 * 3. RENDERING & ROUTING
 */
const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<Upload />} />
            <Route path="/prune" element={<Prune />} />
            <Route path="/macro-tools" element={<MacroTools />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/deploy" element={<Deploy />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </React.StrictMode>
  );
}