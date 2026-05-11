import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Zap, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Layers
} from 'lucide-react';

// @ts-ignore - Adjusting path to reach the context folder from app/pages
import { useApp } from '../../context/AppContext';

export default function MacroTools() {
  const navigate = useNavigate();
  
  // Safe context extraction with fallbacks
  // We cast to 'any' here to resolve the TypeScript error regarding 'macros' not existing on AppContextType
  const context = useApp() as any;
  const endpoints = context?.endpoints || [];
  const selectedEndpoints = context?.selectedEndpoints || new Set();
  const macros = context?.macros || [];
  const setMacros = context?.setMacros || (() => {});

  const [activeMacroId, setActiveMacroId] = useState<string | null>(null);

  // Filter only the endpoints the user previously kept in the "Prune" step
  const availableEndpoints = endpoints.filter((ep: any) => 
    selectedEndpoints.has(`${ep.method}:${ep.path}`)
  );

  const handleAddMacro = () => {
    const newMacro = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'new_macro_tool',
      description: 'Explain to the AI when to use this combined action.',
      steps: [] // Array of { method, path }
    };
    setMacros([...macros, newMacro]);
    setActiveMacroId(newMacro.id);
  };

  const removeMacro = (id: string) => {
    setMacros(macros.filter((m: any) => m.id !== id));
    if (activeMacroId === id) setActiveMacroId(null);
  };

  const addStepToMacro = (macroId: string, endpoint: any) => {
    setMacros(macros.map((m: any) => {
      if (m.id === macroId) {
        return { ...m, steps: [...m.steps, { method: endpoint.method, path: endpoint.path }] };
      }
      return m;
    }));
  };

  const removeStep = (macroId: string, stepIndex: number) => {
    setMacros(macros.map((m: any) => {
      if (m.id === macroId) {
        const newSteps = [...m.steps];
        newSteps.splice(stepIndex, 1);
        return { ...m, steps: newSteps };
      }
      return m;
    }));
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-2 tracking-tight">
            Macro-Tool Bundler
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Bundle sequential API calls into a single "Intent" for the AI. This prevents hallucinations and saves context tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Macro List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Your Macros</h3>
            {macros.map((macro: any) => (
              <button
                key={macro.id}
                onClick={() => setActiveMacroId(macro.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  activeMacroId === macro.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className={`h-4 w-4 ${activeMacroId === macro.id ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="font-medium truncate">{macro.name}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeMacro(macro.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
            <button
              onClick={handleAddMacro}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Macro
            </button>
          </div>

          {/* Right: Macro Editor */}
          <div className="lg:col-span-2">
            {activeMacroId ? (
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                {macros.filter((m: any) => m.id === activeMacroId).map((macro: any) => (
                  <div key={macro.id} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tool Name (for AI)</label>
                      <input 
                        className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-[#141B41] dark:text-white"
                        value={macro.name}
                        onChange={(e) => setMacros(macros.map((m: any) => m.id === macro.id ? {...m, name: e.target.value.replace(/\s+/g, '_')} : m))}
                      />
                      <label className="block text-xs font-bold text-slate-400 uppercase mt-4 mb-2">Instructions for AI</label>
                      <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        value={macro.description}
                        onChange={(e) => setMacros(macros.map((m: any) => m.id === macro.id ? {...m, description: e.target.value} : m))}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Execution Sequence</label>
                      {macro.steps.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-center text-slate-400 text-sm">
                          Click endpoints on the right to add them to this sequence.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {macro.steps.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 group">
                              <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full">{idx + 1}</span>
                              <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">{step.method}</span>
                              <span className="flex-1 font-mono text-xs truncate">{step.path}</span>
                              <button onClick={() => removeStep(macro.id, idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Available Pruned Endpoints</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableEndpoints.map((ep: any) => (
                          <button
                            key={`${ep.method}:${ep.path}`}
                            onClick={() => addStepToMacro(macro.id, ep)}
                            className="flex items-center gap-2 p-2.5 text-left text-xs bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-blue-400 transition-colors"
                          >
                            <Plus className="h-3 w-3 text-blue-500" />
                            <span className="font-bold text-blue-600 uppercase w-8">{ep.method}</span>
                            <span className="truncate">{ep.path}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                <Layers className="h-12 w-12 mb-4 opacity-20" />
                <p>Select or create a macro to start bundling.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
          <button
            onClick={() => navigate('/prune')}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Pruning
          </button>
          
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-900/10 active:scale-95 group"
          >
            Continue to Auth
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}