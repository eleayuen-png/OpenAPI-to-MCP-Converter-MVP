import { Link, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onUrlSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative group">
        <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/swagger.json"
          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="px-8 py-3.5 bg-white dark:bg-slate-800 text-[#141B41] dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-[#141B41] dark:hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </>
        ) : (
          'Import from URL'
        )}
      </button>
    </form>
  );
}