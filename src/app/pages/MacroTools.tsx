import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, ArrowRight, GripVertical, AlertCircle } from 'lucide-react';
import type { MacroTool } from '../context/AppContext';

export default function MacroTools() {
  const navigate = useNavigate();
  const { endpoints, selectedEndpoints, macroTools, setMacroTools } = useApp();
  const [editingMacro, setEditingMacro] = useState<MacroTool | null>(null);
  const [macroName, setMacroName] = useState('');
  const [macroDescription, setMacroDescription] = useState('');
  const [selectedMacroEndpoints, setSelectedMacroEndpoints] = useState<string[]>([]);

  const selectedEndpointsList = endpoints.filter(ep =>
    selectedEndpoints.has(`${ep.method}:${ep.path}`)
  );

  const handleCreateMacro = () => {
    if (!macroName.trim() || selectedMacroEndpoints.length < 2) return;

    const newMacro: MacroTool = {
      id: Math.random().toString(36).substring(2, 15),
      name: macroName,
      description: macroDescription,
      endpoints: selectedMacroEndpoints.map((key, index) => ({
        endpointKey: key,
        order: index + 1,
      })),
    };

    setMacroTools([...macroTools, newMacro]);
    setMacroName('');
    setMacroDescription('');
    setSelectedMacroEndpoints([]);
    setEditingMacro(null);
  };

  const handleDeleteMacro = (id: string) => {
    setMacroTools(macroTools.filter(m => m.id !== id));
  };

  const toggleEndpointInMacro = (key: string) => {
    setSelectedMacroEndpoints(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  if (selectedEndpointsList.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800">No endpoints selected. Please go back and select endpoints.</p>
              <button
                onClick={() => navigate('/prune')}
                className="mt-2 text-sm text-yellow-700 underline"
              >
                Go to Prune Endpoints
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl mb-2">Step 3: Create Macro Tools (Optional)</h2>
          <p className="text-gray-600 mb-6">
            Bundle multiple endpoints into single-intent tools. Example: "Update Deal & Notify Team" → PATCH /deals/:id + POST /slack/message
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Create New Macro Tool</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Macro Name</label>
                  <input
                    type="text"
                    value={macroName}
                    onChange={(e) => setMacroName(e.target.value)}
                    placeholder="e.g., Update Deal & Notify Team"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    value={macroDescription}
                    onChange={(e) => setMacroDescription(e.target.value)}
                    placeholder="What does this macro do?"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Select Endpoints (in order)</label>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                    {selectedEndpointsList.map(ep => {
                      const key = `${ep.method}:${ep.path}`;
                      const isSelected = selectedMacroEndpoints.includes(key);
                      const order = selectedMacroEndpoints.indexOf(key);

                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEndpointInMacro(key)}
                            className="h-4 w-4"
                          />
                          {isSelected && (
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs">
                              {order + 1}
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {ep.method}
                          </span>
                          <code className="text-sm flex-1">{ep.path}</code>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreateMacro}
                  disabled={!macroName.trim() || selectedMacroEndpoints.length < 2}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Macro Tool
                </button>
                <p className="text-xs text-gray-500">
                  Select at least 2 endpoints to create a macro
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">
                Configured Macro Tools ({macroTools.length})
              </h3>

              {macroTools.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  No macro tools created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {macroTools.map(macro => (
                    <div key={macro.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{macro.name}</h4>
                          <p className="text-sm text-gray-600">{macro.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMacro(macro.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1 mt-3">
                        {macro.endpoints.map((ep, idx) => {
                          const [method, path] = ep.endpointKey.split(':');
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">{idx + 1}.</span>
                              <span className="px-2 py-0.5 bg-white rounded text-xs">
                                {method}
                              </span>
                              <code className="text-xs">{path}</code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/prune')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Continue to Auth Setup
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
