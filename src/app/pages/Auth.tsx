import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Lock,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  LogOut,
  User as UserIcon,
  Zap
} from 'lucide-react';

// @ts-ignore - Explicitly resolving the .tsx extension for build stability
import { useApp } from '../context/AppContext.tsx';

function credentialLabel(cred: any) {
  if (cred.type === 'bearer') return 'Bearer Token';
  if (cred.type === 'apiKey-header' || cred.type === 'api-key') return `API Key — ${cred.headerName || 'X-API-Key'} (header)`;
  if (cred.type === 'apiKey-query') return `API Key — ${cred.queryParam || 'api_key'} (query param)`;
  if (cred.type === 'basic') return 'Basic Auth';
  return cred.type;
}

function schemeAuthTypeLabel(authType: string, paramName: string) {
  if (authType === 'bearer') return 'Bearer Token';
  if (authType === 'apiKey-header') return `API Key — ${paramName} (header)`;
  if (authType === 'apiKey-query') return `API Key — ${paramName} (query)`;
  if (authType === 'basic') return 'Basic Auth';
  if (authType === 'oauth2') return 'OAuth2 (use Bearer Token)';
  return authType;
}

export default function Auth() {
  const navigate = useNavigate();
  const context = useApp() as any;
  const { user, loginWithGoogle, logout, credentials, setCredentials, detectedAuthSchemes } = context;

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('bearer');
  const [token, setToken] = useState('');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [queryParam, setQueryParam] = useState('api_key');

  const handleAdd = () => {
    if (!name || !token) return;
    const cred: any = { id: Math.random().toString(), name, type, key: token };
    if (type === 'apiKey-header') cred.headerName = headerName || 'X-API-Key';
    if (type === 'apiKey-query') cred.queryParam = queryParam || 'api_key';
    setCredentials([...credentials, cred]);
    setName('');
    setToken('');
    setHeaderName('X-API-Key');
    setQueryParam('api_key');
  };

  const quickFill = (scheme: any) => {
    const mappedType = scheme.authType === 'oauth2' ? 'bearer' : scheme.authType === 'other' ? 'bearer' : scheme.authType;
    setType(mappedType);
    setName(scheme.name);
    if (scheme.authType === 'apiKey-header') setHeaderName(scheme.paramName || 'X-API-Key');
    if (scheme.authType === 'apiKey-query') setQueryParam(scheme.paramName || 'api_key');
  };

  const handleRemove = (id: string) => {
    setCredentials(credentials.filter((c: any) => c.id !== id));
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* SECTION 1: USER ACCOUNT */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover border-2 border-white dark:border-slate-800" />
                ) : (
                  <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#141B41] dark:text-white">
                  {user?.isAnonymous ? 'Guest Workspace' : user?.displayName || user?.email}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {user?.isAnonymous
                    ? 'Your project is saved locally. Sign in to access it anywhere.'
                    : `Permanently linked to ${user?.email}`}
                </p>
              </div>
            </div>

            {user?.isAnonymous ? (
              <div className="flex gap-3">
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" />
                  Sign in with Google
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* SECTION 2: API KEY VAULT */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white mb-3 tracking-tight">
              API Authentication Vault
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Manage the credentials used by your MCP Proxy to communicate with your target API.
            </p>
          </div>

          {/* Detected Schemes Banner */}
          {detectedAuthSchemes && detectedAuthSchemes.length > 0 && (
            <div className="mb-8 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Detected {detectedAuthSchemes.length} security scheme{detectedAuthSchemes.length !== 1 ? 's' : ''} in your API spec
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedAuthSchemes.map((scheme: any) => (
                  <button
                    key={scheme.name}
                    onClick={() => quickFill(scheme)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="font-bold">{scheme.name}</span>
                    <span className="text-blue-400 dark:text-blue-500">—</span>
                    <span>{schemeAuthTypeLabel(scheme.authType, scheme.paramName)}</span>
                    <span className="ml-1 text-blue-500 dark:text-blue-400">Quick-fill →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-medium text-[#141B41] dark:text-white mb-6">Add New Key</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">Credential Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Stripe API Key"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">Authentication Type</label>
                  <select
                    value={type} onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="apiKey-header">API Key (Header)</option>
                    <option value="apiKey-query">API Key (Query Param)</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
                {type === 'apiKey-header' && (
                  <div>
                    <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">Header Name</label>
                    <input
                      type="text" value={headerName} onChange={(e) => setHeaderName(e.target.value)}
                      placeholder="e.g., X-API-Key"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                    />
                  </div>
                )}
                {type === 'apiKey-query' && (
                  <div>
                    <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">Query Param Name</label>
                    <input
                      type="text" value={queryParam} onChange={(e) => setQueryParam(e.target.value)}
                      placeholder="e.g., api_key"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#141B41] dark:text-slate-300 mb-2">
                    {type === 'basic' ? 'Credentials (user:password)' : 'Secret Token'}
                  </label>
                  <input
                    type="password" value={token} onChange={(e) => setToken(e.target.value)}
                    placeholder={type === 'basic' ? 'username:password' : 'Paste your key here'}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#141B41] dark:text-white transition-colors"
                  />
                  {type === 'basic' && (
                    <p className="mt-1 text-xs text-slate-400">Enter as <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">username:password</code> — will be Base64-encoded automatically.</p>
                  )}
                </div>
                <button
                  onClick={handleAdd} disabled={!name || !token}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" /> Save to Vault
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium text-[#141B41] dark:text-white mb-6">Active Credentials ({credentials.length})</h2>
              {credentials.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 flex items-center justify-center text-center h-[300px]">
                  <p className="text-slate-400 font-medium">Your vault is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((cred: any) => (
                    <div key={cred.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between group transition-all hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[#141B41] dark:text-white">{cred.name}</p>
                          <p className="text-xs text-slate-500">{credentialLabel(cred)}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemove(cred.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 transition-colors">
            <button onClick={() => navigate('/macro-tools')} className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-[#141B41] dark:hover:text-white transition-colors group">
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1" /> Back
            </button>
            <button onClick={() => navigate('/deploy')} className="flex items-center gap-2 px-8 py-2.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:opacity-90 transition-all active:scale-95 group">
              Next: Deploy <ChevronRight className="h-4 w-4 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
