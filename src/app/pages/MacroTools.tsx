import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Zap, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Info,
  Layers
} from 'lucide-react';

/**
 * Note: The "Could not resolve" errors in this preview tool occur because 
 * the browser-based editor cannot see your local filesystem.
 * This path is correct for your local Vite project structure.
 */
// @ts-ignore
import { useApp } from '../context/AppContext';

export default function Macro() {
  const navigate = useNavigate();
  const { endpoints, selectedEndpoints } = useApp();
  const [macros, setMacros] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Filter only the endpoints the user previously kept in the "Prune" step
  // Ensuring selectedEndpoints exists before calling .has()
  const availableEndpoints = endpoints?.filter(ep => 
    selectedEndpoints?.has(`${ep.method}:${ep.path}`)
  ) || [];

  const handleAddMacro = () => {
    const newMacro = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Macro Tool',
      description: 'Combine multiple actions into one intent for the AI.',
      steps: []
    };
    setMacros([...macros, newMacro]);
    setIsCreating(true);
  };

  const removeMacro = (id: string) => {
    setMacros(macros.filter(m => m.id !== id));
    if (macros.length <= 1) setIsCreating(false);
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-2 tracking-tight">
            Macro-Tool Bundler
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            REST APIs are resource-oriented, but AI works best with intents. Combine multiple API calls into a single tool to save context and prevent agent failure.
          </p>
        </div>

        {macros.length === 0 && !isCreating ? (
          <div className="bg-white dark:bg-[#111827] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center transition-all hover:border-blue-400/50">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-[#141B41] dark:text-white mb-2">No Macros Defined</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              You haven't bundled any sequential actions yet. Macros help the AI execute complex tasks in one go.
            </p>
            <button
              onClick={handleAddMacro}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Create First Macro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {macros.map((macro) => (
              <div 
                key={macro.id} 
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={macro.name}
                        onChange={(e) => {
                          const newMacros = macros.map(m => m.id === macro.id ? {...m, name: e.target.value} : m);
                          setMacros(newMacros);
                        }}
                        className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-[#141B41] dark:text-white w-full outline-none"
                        placeholder="Macro Name..."
                      />
                      <input 
                        type="text"
                        value={macro.description}
                        onChange={(e) => {
                          const newMacros = macros.map(m => m.id === macro.id ? {...m, description: e.target.value} : m);
                          setMacros(newMacros);
                        }}
                        className="text-sm text-slate-500 dark:text-slate-400 bg-transparent border-none focus:ring-0 p-0 w-full outline-none mt-1"
                        placeholder="Add a description for the AI..."
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeMacro(macro.id)}
                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2 mt-6">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Operation Sequence</p>
                   <div className="flex items-center gap-3 text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed">
                     <Info className="h-4 w-4 text-blue-500" />
                     {availableEndpoints.length > 0 
                        ? "Drag endpoints here to build a sequence (Coming in V1.1)" 
                        : "No pruned endpoints available. Go back to Step 2 to select some."}
                   </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddMacro}
              className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group bg-white/50 dark:bg-transparent"
            >
              <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Add Another Macro Tool
            </button>
          </div>
        )}

        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
          <button
            onClick={() => navigate('/prune')}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Pruning
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium shadow-sm"
            >
              Skip
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-900/10 active:scale-95 group"
            >
              Save & Continue
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}