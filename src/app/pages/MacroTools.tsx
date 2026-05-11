import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Zap, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Layers,
  Lock,
  Save,
  PlusCircle,
  GripVertical
} from 'lucide-react';

// @ts-ignore
import { useApp } from '../context/AppContext';
import { UpgradeModal } from '../components/UpgradeModal';

export default function Macro() {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { 
    endpoints = [], 
    selectedEndpoints = new Set(), 
    macros = [], 
    setMacros,
    isPro 
  } = useApp();

  const [activeMacroId, setActiveMacroId] = useState<string | null>(null);

  // Filter endpoints that have been selected in the project
  const availableEndpoints = endpoints.filter((ep: any) => 
    selectedEndpoints.has(`${ep.method}:${ep.path}`)
  );

  const activeMacro = macros.find(m => m.id === activeMacroId);

  // 🔒 PAYWALL: If not pro, show a locked state
  if (!isPro) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
          <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-[#141B41] dark:text-white mb-4">Macro Tool Bundling</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          Bundle sequential API calls into high-level tools to save context tokens and provide your AI with powerful, multi-step capabilities.
        </p>
        <button 
          onClick={() => setShowUpgradeModal(true)}
          className="flex items-center gap-2 px-8 py-3.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
        >
          <Lock className="w-4 h-4" />
          Unlock with Pro
        </button>
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
          featureName="Macro Tool Bundling" 
        />
      </div>
    );
  }

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

  const updateMacro = (id: string, updates: any) => {
    setMacros(macros.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMacro = (id: string) => {
    setMacros(macros.filter(m => m.id !== id));
    if (activeMacroId === id) setActiveMacroId(null);
  };

  const addStep = (macroId: string, endpoint: any) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;
    const newStep = { method: endpoint.method, path: endpoint.path };
    updateMacro(macroId, { steps: [...macro.steps, newStep] });
  };

  const removeStep = (macroId: string, index: number) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;
    const newSteps = [...macro.steps];
    newSteps.splice(index, 1);
    updateMacro(macroId, { steps: newSteps });
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Macro Tools</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Chain multiple endpoints into single agentic tools</p>
        </div>
        <button 
          onClick={handleAddMacro}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Macro
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar List */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {macros.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No macros yet</p>
            </div>
          ) : (
            macros.map(macro => (
              <button
                key={macro.id}
                onClick={() => setActiveMacroId(macro.id)}
                className={`p-4 rounded-2xl text-left border-2 transition-all ${
                  activeMacroId === macro.id 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                    : 'border-transparent bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white truncate">{macro.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{macro.steps.length} Steps</div>
              </button>
            ))
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-0 shadow-sm overflow-hidden">
          {activeMacro ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
                <div className="flex-1 mr-4">
                  <input 
                    type="text" 
                    value={activeMacro.name}
                    onChange={(e) => updateMacro(activeMacro.id, { name: e.target.value })}
                    className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white w-full mb-1"
                    placeholder="Tool Name"
                  />
                  <input 
                    type="text" 
                    value={activeMacro.description}
                    onChange={(e) => updateMacro(activeMacro.id, { description: e.target.value })}
                    className="text-sm text-slate-500 bg-transparent border-none focus:ring-0 p-0 w-full"
                    placeholder="Tool Description (Instruction for AI)"
                  />
                </div>
                <button 
                  onClick={() => deleteMacro(activeMacro.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* Step List */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Execution Sequence
                  </h3>
                  
                  <div className="space-y-3">
                    {activeMacro.steps.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                        Add endpoints from the side menu to build your macro.
                      </div>
                    ) : (
                      activeMacro.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                          <div className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded mr-2 ${
                              step.method === 'GET' ? 'bg-green-100 text-green-700' : 
                              step.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {step.method}
                            </span>
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{step.path}</span>
                          </div>
                          <button 
                            onClick={() => removeStep(activeMacro.id, idx)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Available Endpoints Picker */}
                <div className="w-80 border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar shrink-0">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Add Step</h3>
                  <div className="space-y-2">
                    {availableEndpoints.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active endpoints selected in project.</p>
                    ) : (
                      availableEndpoints.map((ep, i) => (
                        <button
                          key={i}
                          onClick={() => addStep(activeMacro.id, ep)}
                          className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-3 group"
                        >
                          <PlusCircle className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-slate-400">{ep.method}</div>
                            <div className="text-xs font-mono truncate">{ep.path}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
              <Layers className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a macro or create a new one to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}