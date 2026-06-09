/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_TOKEN: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_STRIPE_PAYMENT_LINK: string;
  readonly VITE_STRIPE_PRICE_ID: string;
  readonly VITE_STRIPE_PRODUCT_ID: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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