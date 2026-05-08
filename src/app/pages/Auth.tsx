import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, ArrowRight, Eye, EyeOff, Lock, Key } from 'lucide-react';
import type { ApiCredential } from '../context/AppContext';

export default function Auth() {
  const navigate = useNavigate();
  const { credentials, setCredentials } = useApp();
  const [credName, setCredName] = useState('');
  const [credType, setCredType] = useState<'bearer' | 'api-key' | 'basic'>('bearer');
  const [credKey, setCredKey] = useState('');
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  const handleAddCredential = () => {
    if (!credName.trim() || !credKey.trim()) return;

    const newCred: ApiCredential = {
      id: Math.random().toString(36).substring(2, 15),
      name: credName,
      type: credType,
      key: credKey,
      createdAt: new Date(),
    };

    setCredentials([...credentials, newCred]);
    setCredName('');
    setCredKey('');
  };

  const handleDeleteCredential = (id: string) => {
    setCredentials(credentials.filter(c => c.id !== id));
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '****';
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl mb-2">Step 4: API Authentication (Optional)</h2>
          <p className="text-gray-600 mb-6">
            Securely store API keys and tokens. Your credentials are stored in our secure vault and never exposed to the LLM or local machine.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Add API Credential</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Credential Name</label>
                  <input
                    type="text"
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                    placeholder="e.g., Stripe API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Authentication Type</label>
                  <select
                    value={credType}
                    onChange={(e) => setCredType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bearer">Bearer Token</option>
                    <option value="api-key">API Key</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    {credType === 'bearer' ? 'Token' : credType === 'api-key' ? 'API Key' : 'Username:Password'}
                  </label>
                  <input
                    type="password"
                    value={credKey}
                    onChange={(e) => setCredKey(e.target.value)}
                    placeholder={credType === 'basic' ? 'username:password' : 'Paste your key here'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddCredential}
                  disabled={!credName.trim() || !credKey.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Credential
                </button>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Zero-Touch Security</p>
                    <p>Your API keys are encrypted and stored securely. The MCP server acts as a proxy, injecting credentials at runtime without exposing them to the LLM.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">
                Stored Credentials ({credentials.length})
              </h3>

              {credentials.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  No credentials stored yet
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map(cred => (
                    <div key={cred.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Key className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium">{cred.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {cred.type.replace('-', ' ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleKeyVisibility(cred.id)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            {showKeys.has(cred.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(cred.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white rounded px-3 py-2 border border-gray-200">
                        <code className="text-xs break-all">
                          {showKeys.has(cred.id) ? cred.key : maskKey(cred.key)}
                        </code>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Added {cred.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/macro-tools')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate('/deploy')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Continue to Deploy
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
