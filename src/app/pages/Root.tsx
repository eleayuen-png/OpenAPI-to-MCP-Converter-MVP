import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { Activity, Moon, Sun, Sparkles } from 'lucide-react';
import { usePostHog } from '@posthog/react';

/**
 * These imports reference other files in your local project.
 * Note: The "Could not resolve" errors in this preview tool occur because 
 * the browser-based editor cannot see your local filesystem.
 */
import { WizardNav } from '../components/WizardNav';
import { AppProvider } from '../context/AppContext';

export default function Root() {
  const location = useLocation();
  const isLogsPage = location.pathname === '/logs';
  const posthog = usePostHog();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [location.pathname]);

  // Initialize theme from system preference or previous state
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
    }
  }, []);

  // Update document class when dark mode changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
        <header className="bg-white/80 dark:bg-[#141B41]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-[#141B41] dark:bg-blue-500 p-2.5 rounded-xl shadow-md group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold tracking-tight text-[#141B41] dark:text-white leading-tight">
                  MCP<span className="font-light text-slate-500 dark:text-blue-300"> Studio</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-blue-200 font-bold tracking-widest uppercase">
                  API to Agent
                </p>
              </div>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-full transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link
                to="/logs"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity Logs</span>
              </Link>
            </div>
          </div>
        </header>

        {/* The Wizard navigation only shows on the main tool path, not the logs page */}
        {!isLogsPage && <WizardNav />}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}