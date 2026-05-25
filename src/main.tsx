import * as buffer from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

/**
 * 1. THE POLYFILL
 * Ensures Buffer is available globally for packages that expect it.
 * We use 'import * as buffer' to ensure compatibility with Vite's production build.
 */
declare global {
  interface Window {
    Buffer: any;
  }
}

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || buffer.Buffer;
}

posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: 'identified_only',
  capture_pageview: false,
  defaults: '2026-01-30',
});

/**
 * 2. IMPORTS
 * Removing explicit extensions to allow the bundler to resolve the modules 
 * based on the project configuration.
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
 */
const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container as HTMLElement);
  root.render(
    <React.StrictMode>
      <PostHogProvider client={posthog}>
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
      </PostHogProvider>
    </React.StrictMode>
  );
}