import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';

/**
 * 1. THE POLYFILL (Must be at the absolute top)
 * This allows browser-based libraries like @apidevtools/swagger-parser to function.
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
 * We import the layout (Root) and all individual step pages.
 * * NOTE FOR PREVIEW TOOL: The "Could not resolve" errors appearing in this 
 * specific preview window are expected because the online editor cannot 
 * access your local filesystem where Root.tsx, theme.css, etc. reside. 
 * These paths are correct for your local Vite project structure.
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
 * We wrap the app in BrowserRouter and define the nested routes.
 * The <Outlet /> inside Root.tsx will render these child components.
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
            <Route path="macro-tools" element={<MacroTools />} />
            <Route path="auth" element={<Auth />} />
            <Route path="deploy" element={<Deploy />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}