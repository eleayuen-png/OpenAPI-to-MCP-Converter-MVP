import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Plus, Trash2, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [type, setType] = useState('Bearer Token');
  const [token, setToken] = useState('');

  const handleAdd = () => {
    if (!name || !token) return;
    setCredentials([...credentials, { id: Math.random().toString(), name, type, key: token }]);
    setName('');
    setToken('');
  };

  const handleRemove = (id: string) => {
    setCredentials(credentials.filter((c: any) => c.id !== id));
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto bg-white dark:bg-[#111827] rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-3 tracking-tight">
            Step 4: API Authentication (Optional)
          </h1>
          <p className="text-[#141B41]/70 dark:text-slate-400 text-lg">
            Securely store API keys and tokens. Your credentials are stored in our secure vault and never exposed to the LLM or local machine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Add Credential */}
          <div>
            <h2 className="text-xl font-medium text-[#141B41] dark:text-white mb-6">Add API Credential</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Stripe API Key"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white placeholder:text-slate-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">
                  Authentication Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                >
                  <option>Bearer Token</option>
                  <option>API Key (Header)</option>
                  <option>Basic Auth</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">
                  Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your key here"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white placeholder:text-slate-400 transition-colors"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!name || !token}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#141B41] dark:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
                Add Credential
              </button>

              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 flex items-start gap-3 transition-colors">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[#141B41] dark:text-blue-300 mb-1">Zero-Touch Security</h4>
                  <p className="text-sm text-[#141B41]/70 dark:text-blue-400/80 leading-relaxed">
                    Your API keys are encrypted and stored securely. The MCP server acts as a proxy, injecting credentials at runtime without exposing them to the LLM.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stored Credentials */}
          <div>
            <h2 className="text-xl font-medium text-[#141B41] dark:text-white mb-6">
              Stored Credentials ({credentials.length})
            </h2>
            
            {credentials.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 flex items-center justify-center text-center h-[340px] transition-colors">
                <p className="text-[#141B41]/50 dark:text-slate-400 font-medium">No credentials stored yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred: any) => (
                  <div key={cred.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <Lock className="h-4 w-4 text-[#141B41]/60 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[#141B41] dark:text-white">{cred.name}</p>
                        <p className="text-xs text-[#141B41]/60 dark:text-slate-400">{cred.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(cred.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
          <button
            onClick={() => navigate('/macro-tools')}
            className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Macros
          </button>
          
          <button
            onClick={() => navigate('/deploy')}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-blue-900/10 active:scale-95 group"
          >
            Continue to Deploy
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
      </div>
    </div>
  );
}