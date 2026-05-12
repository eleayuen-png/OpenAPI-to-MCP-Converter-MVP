import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useNavigate, MemoryRouter, Routes, Route } from 'react-router';
import { 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Search, 
  Check, 
  Lightbulb, 
  Sparkles, 
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react';

// ============================================================================
// 🛑 INTERNAL CONTEXT (Ensures the file compiles and runs in this environment)
// ============================================================================
// We define the context and hook locally to avoid the "Could not resolve" error 
// in the preview while maintaining the same API for your production build.

const AppContext = createContext<any>(null);

const useApp = () => {
  const context = useContext(AppContext);
  // Fallback for standalone preview if context isn't provided by a parent
  if (!context) {
    return {
      endpoints: [
        { id: 'GET:/pet', method: 'GET', path: '/pet', description: 'Finds pets by status', tags: ['Pet Inventory'] },
        { id: 'POST:/pet', method: 'POST', path: '/pet', description: 'Add a new pet to the store', tags: ['Pet Inventory'] },
        { id: 'GET:/pet/findByStatus', method: 'GET', path: '/pet/findByStatus', description: 'Finds pets by status', tags: ['Pet Inventory'] },
        { id: 'GET:/pet/findByTags', method: 'GET', path: '/pet/findByTags', description: 'Finds pets by tags', tags: ['Pet Inventory'] },
        { id: 'GET:/store/inventory', method: 'GET', path: '/store/inventory', description: 'Returns pet inventories', tags: ['Store'] }
      ],
      selectedEndpoints: new Set(),
      setSelectedEndpoints: () => {}
    };
  }
  return context;
};

// ============================================================================
// --- PRUNE PAGE COMPONENT ---
// ============================================================================

function PrunePage() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  const context = useApp() as any;
  const { endpoints = [], selectedEndpoints = new Set(), setSelectedEndpoints } = context;
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Timer logic for Magic Suggest
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // 2. Filter endpoints based on search
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep: any) => 
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [endpoints, searchQuery]);

  const toggleEndpoint = (id: string) => {
    const newSet = new Set(selectedEndpoints);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEndpoints(newSet);
  };

  /**
   * 🚀 RESTORED: SELECT ALL FUNCTIONALITY
   */
  const selectAll = () => {
    const allIds = new Set(endpoints.map((ep: any) => ep.id || `${ep.method}:${ep.path}`));
    setSelectedEndpoints(allIds);
  };

  const deselectAll = () => {
    setSelectedEndpoints(new Set());
  };

  const handleMagicSuggest = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const payload = endpoints.map((ep: any) => ({
        id: ep.id || `${ep.method}:${ep.path}`,
        description: ep.description || ''
      }));

      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/analyze-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: payload })
      });
      
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Server Error");

      if (data.suggestions) {
        setSelectedEndpoints(new Set(data.suggestions));
      }
    } catch (error: any) {
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-2 tracking-tight">Prune Endpoints</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Refine your API surface for the AI agent.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
             <Zap className="w-4 h-4 text-blue-500" />
             <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{selectedEndpoints.size} Active Tools</span>
           </div>
        </div>
      </div>

      {analysisError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Magic Suggest Failed</p>
            <p>{analysisError}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button onClick={handleMagicSuggest} disabled={isAnalyzing} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="whitespace-nowrap">{isAnalyzing ? `Analyzing (${secondsElapsed}s)` : 'Magic Suggest'}</span>
          </button>
          
          <button onClick={selectAll} className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors whitespace-nowrap">
            Select All
          </button>
          
          <button onClick={deselectAll} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap">
            Deselect
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredEndpoints.map((ep: any) => {
          const id = ep.id || `${ep.method}:${ep.path}`;
          const isSelected = selectedEndpoints.has(id);
          return (
            <div key={id} onClick={() => toggleEndpoint(id)} className={`p-4 bg-white dark:bg-[#111827] border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
              <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{ep.method}</span>
              <span className="flex-1 font-mono text-xs font-medium dark:text-blue-100 truncate">{ep.path}</span>
              <span className="hidden sm:block text-xs text-slate-500 italic truncate max-w-[200px]">{ep.description || 'No description'}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] font-medium transition-all hover:-translate-x-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button 
          onClick={() => navigate('/macro-tools')} 
          className="flex items-center gap-2 px-10 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all active:scale-95"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// --- STANDALONE WRAPPER (For Compilation & Preview) ---
// ============================================================================

export default function App() {
  const [selectedEndpoints, setSelectedEndpoints] = useState(new Set());
  
  return (
    <MemoryRouter>
      <AppContext.Provider value={{ selectedEndpoints, setSelectedEndpoints }}>
        <div className="min-h-screen bg-[#020617] text-slate-200">
          <Routes>
            <Route path="*" element={<PrunePage />} />
          </Routes>
        </div>
      </AppContext.Provider>
    </MemoryRouter>
  );
}