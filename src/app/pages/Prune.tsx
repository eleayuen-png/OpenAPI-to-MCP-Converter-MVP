import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
// @ts-ignore
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronLeft, Filter, Search, Check, Lightbulb } from 'lucide-react';

export default function Prune() {
  const navigate = useNavigate();
  
  let context: any = null;
  try {
    context = useApp();
  } catch (e) {
    // Fallback for isolated preview environments
  }

  if (!context) {
    return <div className="p-20 text-center text-slate-500">Initializing workspace...</div>;
  }

  const { endpoints = [], selectedEndpoints = new Set(), setSelectedEndpoints = () => {} } = context;

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

  const deselectAllGlobal = () => {
    setSelectedEndpoints(new Set());
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'POST': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* Search & Global Controls */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints by path or description..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white placeholder:text-slate-400 transition-colors"
              />
            </div>
            <button
              onClick={deselectAllGlobal}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              Deselect All
            </button>
          </div>
          
          <div className="p-3 sm:p-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-[#141B41] text-white dark:bg-blue-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {cat} <span className="ml-1 opacity-70">({groupedEndpoints[cat].length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories & Endpoints List */}
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([category, eps]) => {
            const categoryIds = eps.map((ep: any) => `${ep.method}:${ep.path}`);
            const isAllSelected = categoryIds.every((id: string) => selectedEndpoints.has(id));

            return (
              <div key={category} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
                <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <h3 className="font-semibold text-[#141B41] dark:text-white">
                      {category} <span className="text-slate-500 font-normal">({eps.length} endpoints)</span>
                    </h3>
                  </div>
                  <button 
                    onClick={() => toggleCategory(categoryIds, isAllSelected)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md"
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {eps.map((ep: any) => {
                    const id = `${ep.method}:${ep.path}`;
                    const isSelected = selectedEndpoints.has(id);
                    return (
                      <div key={id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <button 
                          onClick={() => toggleEndpoint(id)}
                          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                        
                        <div className={`px-2.5 py-1 text-[11px] font-bold rounded border ${getMethodColor(ep.method)}`}>
                          {ep.method.toUpperCase()}
                        </div>
                        
                        <div className="flex-1 font-mono text-sm font-medium text-[#141B41] dark:text-blue-100 truncate">
                          {ep.path}
                        </div>
                        
                        <div className="hidden sm:block flex-1 text-sm text-[#141B41]/70 dark:text-slate-400 truncate text-right">
                          {ep.description || ep.summary || 'No description provided'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Helper Tip */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-start sm:items-center gap-3 transition-colors">
          <Lightbulb className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-sm text-[#141B41]/80 dark:text-blue-200/80">
            <strong className="text-[#141B41] dark:text-blue-200">Context Window Tip:</strong> Selecting fewer endpoints keeps your LLM's context lean and prevents hallucinations. Each endpoint uses ~150 tokens on average.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Upload
          </button>
          
          <button
            onClick={() => navigate('/macro-tools')}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-900/10 active:scale-95 group"
          >
            Continue to Macro Tools
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}