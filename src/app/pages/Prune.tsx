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

const AppContext = createContext<any>(null);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {
      endpoints: [
        { id: 'PUT:/pet', method: 'PUT', path: '/pet', description: 'Update an existing pet', category: 'Pet Inventory' },
        { id: 'POST:/pet', method: 'POST', path: '/pet', description: 'Add a new pet to the store', category: 'Pet Inventory' },
        { id: 'GET:/pet/findByStatus', method: 'GET', path: '/pet/findByStatus', description: 'Finds Pets by status', category: 'Pet Inventory' },
        { id: 'GET:/pet/findByTags', method: 'GET', path: '/pet/findByTags', description: 'Finds Pets by tags', category: 'Pet Inventory' },
        { id: 'GET:/pet/{petId}', method: 'GET', path: '/pet/{petId}', description: 'Find pet by ID', category: 'Pet Inventory' },
        { id: 'GET:/store/inventory', method: 'GET', path: '/store/inventory', description: 'Returns pet inventories', category: 'Analytics' },
        { id: 'POST:/store/order', method: 'POST', path: '/store/order', description: 'Place an order for a pet', category: 'Order Management' },
        { id: 'POST:/user', method: 'POST', path: '/user', description: 'Create user', category: 'User Management' },
        { id: 'GET:/analytics/sales', method: 'GET', path: '/analytics/sales', description: 'Get aggregate sales data', category: 'Analytics' }
      ],
      selectedEndpoints: new Set(['GET:/pet/findByStatus', 'GET:/store/inventory']),
      setSelectedEndpoints: () => {},
      user: { uid: 'canvas-preview-user' }
    };
  }
  return context;
};

export default function Prune() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const context = useApp() as any;
  const { 
    endpoints = [], 
    selectedEndpoints = new Set(), 
    setSelectedEndpoints,
    user 
  } = context || {};

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

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

      // 🚩 FIX: Pointing to your NEW Oregon Render URL
      const response = await fetch('https://mcp-backend-q8y7.onrender.com/api/analyze-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: payload })
      });
      
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Server Error");
      if (data.suggestions) setSelectedEndpoints(new Set(data.suggestions));
    } catch (error: any) {
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
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

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 transition-colors sticky top-20 z-40 backdrop-blur-md">
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

      <div className="space-y-6 min-h-[400px]">
        {Object.keys(groupedEndpoints).length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl animate-in fade-in zoom-in-95">
             <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
               <Database className="h-8 w-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-[#141B41] dark:text-white mb-2">No endpoints detected</h3>
             <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
               We couldn't find any valid routes. Ensure your JSON file is a valid OpenAPI/Swagger specification.
             </p>
             
             <div className="max-w-md mx-auto bg-slate-950 rounded-xl p-5 text-left border border-slate-800 shadow-xl font-mono">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <Terminal className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Diagnostics</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-slate-500">Auth Status:</span>
                    <span className={user ? 'text-green-400' : 'text-yellow-400'}>{user ? 'Connected' : 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endpoint Array:</span>
                    <span className="text-blue-400 font-bold">{endpoints?.length || 0} items found in memory</span>
                  </div>
                </div>
                <button onClick={() => navigate('/')} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95">
                  Return to Upload
                </button>
             </div>
          </div>
        ) : (
          Object.entries(groupedEndpoints).map(([category, eps]) => {
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
                        <div className="hidden sm:block flex-1 text-[11px] text-slate-500 italic truncate text-right">
                          {ep.description || ep.summary || 'No description provided'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 flex items-start gap-4 transition-colors">
        <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-xl">
           <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-[#141B41] dark:text-blue-200 font-bold mb-1">Efficiency Tip: Schema Pruning</p>
          <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed">
            Selecting only high-value tools (GET/SEARCH/UPDATE) keeps the LLM's context window lean and prevents choice paralysis during agent reasoning.
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] font-medium transition-all hover:-translate-x-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button 
          onClick={() => navigate('/macro-tools')} 
          className="flex items-center gap-2 px-10 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedEndpoints.size === 0}
        >
          Continue to Macros <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}