import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
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
// 🛑 PREVIEW CONTEXT (Ensures the file compiles and runs in this environment)
// ============================================================================
const AppContext = createContext<any>(null);
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) return {
    endpoints: [
      { id: 'GET:/pet', method: 'GET', path: '/pet', description: 'Find pets', tags: ['Pet Inventory'] },
      { id: 'POST:/pet', method: 'POST', path: '/pet', description: 'Add pet', tags: ['Pet Inventory'] },
      { id: 'GET:/store/inventory', method: 'GET', path: '/store/inventory', description: 'Returns pet inventories', tags: ['Store'] }
    ],
    selectedEndpoints: new Set(),
    setSelectedEndpoints: () => {}
  };
  return context;
};

// --- UI COMPONENTS ---

export default function App() {
  const [endpoints, setEndpoints] = useState<any[]>([
    { method: 'GET', path: '/pet', description: 'Finds pets by status', tags: ['Pet Inventory'] },
    { method: 'POST', path: '/pet', description: 'Add a new pet to the store', tags: ['Pet Inventory'] },
    { method: 'GET', path: '/pet/findByStatus', description: 'Finds pets by status', tags: ['Pet Inventory'] },
    { method: 'GET', path: '/pet/findByTags', description: 'Finds pets by tags', tags: ['Pet Inventory'] },
    { method: 'GET', path: '/pet/{petId}', description: 'Find pet by ID', tags: ['Pet Inventory'] },
    { method: 'POST', path: '/pet/{petId}', description: 'Updates a pet in the store with form data', tags: ['Pet Inventory'] },
    { method: 'DELETE', path: '/pet/{petId}', description: 'Deletes a pet', tags: ['Pet Inventory'] },
    { method: 'GET', path: '/store/inventory', description: 'Returns pet inventories by status', tags: ['Store'] },
    { method: 'POST', path: '/store/order', description: 'Place an order for a pet', tags: ['Store'] },
    { method: 'GET', path: '/store/order/{orderId}', description: 'Find purchase order by ID', tags: ['Store'] },
  ]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());

  const contextValue = {
    endpoints,
    selectedEndpoints,
    setSelectedEndpoints
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#020617] text-slate-200">
         <PruneContent />
      </div>
    </AppContext.Provider>
  );
}

function PruneContent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  const { endpoints, selectedEndpoints, setSelectedEndpoints } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group endpoints by their first tag, or 'Uncategorized'
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, any[]> = {};
    endpoints.forEach((ep: any) => {
      const tag = (ep.tags && ep.tags.length > 0) ? ep.tags[0] : 'Uncategorized';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(ep);
    });
    return groups;
  }, [endpoints]);

  const allCategories = Object.keys(groupedEndpoints).sort();

  // Filter groups based on search and selected category
  const filteredGroups = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.entries(groupedEndpoints).forEach(([category, eps]) => {
      if (activeCategory && category !== activeCategory) return;
      
      const filteredEps = eps.filter((ep: any) => 
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (filteredEps.length > 0) {
        result[category] = filteredEps;
      }
    });
    return result;
  }, [groupedEndpoints, searchQuery, activeCategory]);

  const toggleEndpoint = (id: string) => {
    const newSet = new Set(selectedEndpoints);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
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

  const selectAllGlobal = () => {
    const allIds = new Set(endpoints.map((ep: any) => `${ep.method}:${ep.path}`));
    setSelectedEndpoints(allIds);
  };

  const deselectAllGlobal = () => {
    setSelectedEndpoints(new Set());
  };

  const handleMagicSuggest = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSecondsElapsed(0);

    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    try {
      const payload = endpoints.map((ep: any) => ({
        id: `${ep.method}:${ep.path}`,
        description: ep.description || ep.summary || ''
      }));

      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/analyze-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: payload })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || "Server Error");
      }

      if (data.suggestions) {
        setSelectedEndpoints(new Set(data.suggestions));
      }
    } catch (error: any) {
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
      clearInterval(timer);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'POST': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        
        {analysisError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Magic Suggest Failed</p>
              <p>{analysisError}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleMagicSuggest}
                disabled={isAnalyzing}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAnalyzing ? `Analyzing (${secondsElapsed}s)` : 'Magic Suggest'}</span>
              </button>
              
              <button
                onClick={selectAllGlobal}
                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors"
              >
                Select All
              </button>

              <button
                onClick={deselectAllGlobal}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
          
          <div className="p-3 sm:p-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-[#141B41] text-white dark:bg-blue-600'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              All Categories
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#141B41] text-white dark:bg-blue-600'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat} <span className="ml-1 opacity-70">({groupedEndpoints[cat].length})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([category, eps]) => {
            const categoryIds = eps.map((ep: any) => `${ep.method}:${ep.path}`);
            const isAllSelected = categoryIds.every((id: string) => selectedEndpoints.has(id));

            return (
              <div key={category} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-[#141B41] dark:text-white">
                      {category} <span className="text-slate-500 font-normal">({eps.length} endpoints)</span>
                    </h3>
                  </div>
                  <button 
                    onClick={() => toggleCategory(categoryIds, isAllSelected)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md"
                  >
                    {isAllSelected ? 'Deselect Category' : 'Select Category'}
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {eps.map((ep: any) => {
                    const id = `${ep.method}:${ep.path}`;
                    const isSelected = selectedEndpoints.has(id);
                    return (
                      <div key={id} onClick={() => toggleEndpoint(id)} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer">
                        <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                        
                        <div className={`px-2.5 py-1 text-[11px] font-bold rounded border ${getMethodColor(ep.method)}`}>
                          {ep.method.toUpperCase()}
                        </div>
                        
                        <div className="flex-1 font-mono text-sm font-medium text-[#141B41] dark:text-blue-100 truncate">
                          {ep.path}
                        </div>
                        
                        <div className="hidden sm:block flex-1 text-sm text-slate-500 truncate text-right italic">
                          {ep.description || 'No description'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-sm text-[#141B41]/80 dark:text-blue-200/80">
            <strong>Pro Tip:</strong> Keep your MCP server lean by only selecting the tools your AI agent actually needs.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8">
          <button className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 font-medium">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-medium shadow-lg">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}