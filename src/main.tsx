import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';

/**
 * 1. THE POLYFILL
 * Required for swagger-parser to work in the browser.
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
 * 2. IMPORTS & FALLBACKS
 * To resolve the compilation errors in this preview environment, 
 * we define the routes and ensure the app can initialize.
 * Note: In your local project, these imports will resolve to your files.
 */
import Root from './app/pages/Root';
import Upload from './app/pages/Upload';
import Prune from './app/pages/Prune';
import Macro from './app/pages/MacroTools';
import Auth from './app/pages/Auth';
import Deploy from './app/pages/Deploy';
import Logs from './app/pages/Logs';
import './styles/theme.css'; 

/**
 * 3. ROUTING & RENDERING
 */
const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<Upload />} />
            <Route path="prune" element={<Prune />} />
            <Route path="macro" element={<Macro />} />
            <Route path="auth" element={<Auth />} />
            <Route path="deploy" element={<Deploy />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}