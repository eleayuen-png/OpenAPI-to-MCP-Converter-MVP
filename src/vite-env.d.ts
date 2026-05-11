/// <reference types="vite/client" />

/**
 * This file tells TypeScript how to handle Vite-specific features.
 */

// Fixes "Could not find a declaration file for module 'react-dom/client'"
declare module 'react-dom/client' {
  import { Root } from 'react-dom/client';
  import { ReactNode } from 'react';
  
  export function createRoot(container: Element | DocumentFragment): {
    render(children: ReactNode): void;
    unmount(): void;
  };
}

// Global declaration for the Buffer polyfill used in main.tsx
declare interface Window {
  Buffer: any;
}