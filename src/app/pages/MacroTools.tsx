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

// @ts-ignore - Resolving potential path issues in build environment
import { useApp } from '../context/AppContext';

export default function MacroTools() {
  const navigate = useNavigate();
  
  // Safe context extraction with fallbacks
  const context = useApp();
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
      steps: [] 
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
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Macros</h3>
              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{macros.length}</span>
            </div>
            
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
                  <span className="font-medium truncate text-sm">{macro.name}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeMacro(macro.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}
            <button
              onClick={handleAddMacro}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Create New Macro
            </button>
          </div>

          {/* Right: Macro Editor */}
          <div className="lg:col-span-2">
            {activeMacroId ? (
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {macros.filter((m: any) => m.id === activeMacroId).map((macro: any) => (
                  <div key={macro.id}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tool Name</label>
                        <input 
                          className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-[#141B41] dark:text-white"
                          value={macro.name}
                          onChange={(e) => setMacros(macros.map((m: any) => m.id === macro.id ? {...m, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_')} : m))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">AI Instruction</label>
                        <input 
                          className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-400"
                          placeholder="e.g. Use this to create a user and assign them to a team."
                          value={macro.description}
                          onChange={(e) => setMacros(macros.map((m: any) => m.id === macro.id ? {...m, description: e.target.value} : m))}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50/30 dark:bg-black/10">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                         Execution Sequence
                      </h4>
                      {macro.steps.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-sm">
                          Add endpoints from the list below to build your sequence.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {macro.steps.map((step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">{idx + 1}</span>
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded tracking-tighter">{step.method}</span>
                              <span className="flex-1 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{step.path}</span>
                              <button onClick={() => removeStep(macro.id, idx)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Available Pruned Endpoints</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableEndpoints.map((ep: any) => (
                          <button
                            key={`${ep.method}:${ep.path}`}
                            onClick={() => addStepToMacro(macro.id, ep)}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 transition-all text-left shadow-sm group"
                          >
                            <Plus className="w-4 h-4 text-blue-500 group-hover:scale-125 transition-transform" />
                            <div>
                                <div className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1">{ep.method}</div>
                                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">{ep.path}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                <Layers className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Select a macro to start bundling</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
          <button
            onClick={() => navigate('/prune')}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Pruning
          </button>
          
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg"
          >
            Continue to Auth
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}