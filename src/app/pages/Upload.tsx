import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileUpload } from '../components/FileUpload';
import { UrlInput } from '../components/UrlInput';
import { parseOpenAPIFile, parseOpenAPIFromUrl } from '../utils/openapi-parser';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const { setEndpoints, setSelectedEndpoints } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const parsedEndpoints = await parseOpenAPIFile(file);
      setEndpoints(parsedEndpoints);
      const allKeys = parsedEndpoints.map(ep => `${ep.method}:${ep.path}`);
      setSelectedEndpoints(new Set(allKeys));
      navigate('/prune');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse OpenAPI file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const parsedEndpoints = await parseOpenAPIFromUrl(url);
      setEndpoints(parsedEndpoints);
      const allKeys = parsedEndpoints.map(ep => `${ep.method}:${ep.path}`);
      setSelectedEndpoints(new Set(allKeys));
      navigate('/prune');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch OpenAPI spec from URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto mt-8 sm:mt-12 text-center mb-10 sm:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#141B41] dark:text-white">
          Give your AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Superpowers</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
          Instantly generate secure Model Context Protocol (MCP) servers from your OpenAPI specs. No boilerplate glue code required.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 sm:p-10 transition-colors">
          <h2 className="text-xl font-semibold mb-8 flex items-center gap-3 text-[#141B41] dark:text-white">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-sm shadow-sm">1</span>
            Provide your API Specification
          </h2>

          <FileUpload onFileSelect={handleFileSelect} />

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">OR IMPORT FROM URL</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <UrlInput onUrlSubmit={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Parsing OpenAPI specification...</p>
          </div>
        )}
      </div>
    </div>
  );
}