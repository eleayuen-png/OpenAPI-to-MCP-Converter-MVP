import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import { 
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Search, 
  Check, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  Zap, 
  Terminal, 
  Database,
  Lightbulb
} from 'lucide-react';

/**
 * 🛑 PREVIEW BRIDGE logic
 * In your local project, the code below will attempt to import your real AppContext.
 * If it fails (like in this preview environment), it falls back to a mock state
 * so the UI remains fully interactive for testing.
 */
// @ts-ignore
import * as AppContextModule from '../context/AppContext';

const useAppBridge = () => {
  // Local state for the preview environment so checkboxes work here
  const [localSelection, setLocalSelection] = useState(new Set(['GET:/pet/findByStatus']));
  
  try {
    // Try to use the real context from your project
    const context = AppContextModule.useApp();
    if (context) return context;
  } catch (e) {
    // Fallback data for the browser preview environment
    return {
      endpoints: [
        { id: 'GET:/pet/findByStatus', method: 'GET', path: '/pet/findByStatus', description: 'Finds pets by status', category: 'Pet Inventory' },
        { id: 'GET:/store/inventory', method: 'GET', path: '/store/inventory', description: 'Returns pet inventories', category: 'Store' },
        { id: 'POST:/store/order', method: 'POST', path: '/store/order', description: 'Place an order for a pet', category: 'Store' },
        { id: 'GET:/analytics/sales', method: 'GET', path: '/analytics/sales', description: 'Get sales data', category: 'Analytics' }
      ],
      selectedEndpoints: localSelection,
      setSelectedEndpoints: setLocalSelection,
      user: { uid: 'preview-user' }
    };
  }
};

export default function Prune() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const context = useAppBridge() as any;
  const { 
    endpoints = [], 
    selectedEndpoints = new Set(), 
    setSelectedEndpoints,
    user 
  } = context || {};

  // 1. Magic Suggest Timer logic
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // 2. Group endpoints by category
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const filtered = (endpoints || []).filter((ep: any) => 
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.forEach((ep: any) => {
      const tag = ep.category || 'Uncategorized';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(ep);
    });
    return groups;
  }, [endpoints, searchQuery]);

  const toggleEndpoint = (id: string) => {
    const newSet = new Set(selectedEndpoints);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEndpoints(newSet);
  };

  const toggleCategory = (categoryIds: string[], isAllSelected: boolean) => {
    const newSet = new Set(selectedEndpoints);
    if (isAllSelected) {
      categoryIds.forEach(id => newSet.delete(id));
    } else {
      categoryIds.forEach(id => newSet.add(id));
    }
    setSelectedEndpoints(newSet);
  };

  const selectAll = () => {
    const allIds = new Set((endpoints || []).map((ep: any) => ep.id || `${ep.method}:${ep.path}`));
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

      // Pointing to your Oregon Render URL
      const response = await fetch('https://mcp-backend-q8y7.onrender.com/api/analyze-schema', {
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
    <div className="p-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-2 tracking-tight">Prune Endpoints</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Select the tools for your AI agent.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 transition-all">
             <Zap className="w-4 h-4 text-blue-500" />
             <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{selectedEndpoints?.size || 0} Selected</span>
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

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 transition-colors sticky top-4 z-40 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter endpoints..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
          />
        </div>
        
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button onClick={handleMagicSuggest} disabled={isAnalyzing || !endpoints.length} className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="whitespace-nowrap">{isAnalyzing ? `Analyzing (${secondsElapsed}s)` : 'Magic Suggest'}</span>
          </button>
          <button onClick={selectAll} className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors whitespace-nowrap">
            Select All
          </button>
          <button onClick={deselectAll} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200 transition-colors whitespace-nowrap">
            Deselect
          </button>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        {Object.entries(groupedEndpoints).map(([category, eps]) => {
          const categoryIds = eps.map((ep: any) => ep.id || `${ep.method}:${ep.path}`);
          const isAllSelected = categoryIds.every((id: string) => selectedEndpoints.has(id));

          return (
            <div key={category} className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-[#141B41] dark:text-white text-sm">
                    {category} <span className="text-slate-400 font-medium ml-1">({eps.length})</span>
                  </h3>
                </div>
                <button 
                  onClick={() => toggleCategory(categoryIds, isAllSelected)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:opacity-70 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                >
                  {isAllSelected ? 'Deselect All' : 'Select Category'}
                </button>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {eps.map((ep: any) => {
                  const id = ep.id || `${ep.method}:${ep.path}`;
                  const isSelected = selectedEndpoints.has(id);
                  return (
                    <div key={id} onClick={() => toggleEndpoint(id)} className={`p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
                      <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-sm' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </div>
                      <div className={`px-2 py-0.5 text-[10px] font-black rounded border tracking-tighter ${
                        ep.method === 'GET' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 
                        ep.method === 'POST' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {ep.method.toUpperCase()}
                      </div>
                      <div className="flex-1 font-mono text-xs font-semibold text-[#141B41] dark:text-blue-100 truncate">
                        {ep.path}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8">
        <button onClick={() => navigate('/')} className="text-slate-600 dark:text-slate-400 font-medium transition-all hover:-translate-x-1 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button 
          onClick={() => navigate('/macro-tools')} 
          className="flex items-center gap-2 px-10 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          disabled={selectedEndpoints.size === 0}
        >
          Continue to Macros <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}