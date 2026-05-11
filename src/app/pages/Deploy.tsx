import React, { useState } from 'react';
import { useNavigate } from 'react-router';
// @ts-ignore
import { useApp } from '../context/AppContext';
import { AlertCircle, Server, CheckCircle2, Copy, Download, Terminal, Check, Code, Pointer } from 'lucide-react';

export function DeploymentPanel({ onDeploy, isDeploying, baseUrl, setBaseUrl }: { onDeploy: () => void, isDeploying: boolean, baseUrl: string, setBaseUrl: (url: string) => void }) {
  // Safe context extraction for environments
  let context: any = null;
  try { context = useApp(); } catch(e) {}
  const selectedEndpoints = context?.selectedEndpoints || new Set();

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors">
      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Server className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-[#141B41] dark:text-white mb-4">Ready to Deploy</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
        You have selected {selectedEndpoints.size} endpoints. We will securely deploy an MCP server configuration that proxies requests through your provided credentials.
      </p>

      <div className="max-w-md mx-auto mb-8 text-left">
        <label className="text-sm font-medium text-[#141B41] dark:text-slate-300 mb-1.5 block">Target API Base URL</label>
        <input 
          type="url" 
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="e.g., https://api.example.com/v1"
          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#141B41] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <button
        onClick={onDeploy}
        disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim()}
        className="px-8 py-3.5 bg-[#141B41] hover:bg-[#1a2352] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
      >
        {isDeploying ? 'Deploying Server...' : 'Deploy MCP Server'}
      </button>
    </div>
  );
}

export function DeploymentSuccess() {
  // Safe context extraction for environments
  let context: any = null;
  try { context = useApp(); } catch(e) {}
  const deploymentInfo = context?.deploymentInfo;
  const selectedEndpoints = context?.selectedEndpoints || new Set();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState<'claude' | 'cline' | 'cursor'>('cursor');
  
  if (!deploymentInfo) return null;

  const serverUrl = deploymentInfo.serverUrl || 'http://localhost:3000/sse/example-id';
  const apiKey = deploymentInfo.apiKey || "no-key-provided";
  
  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // We keep the JSON config for Claude/Cline as they still rely on stdio/command proxies
  const jsonConfig = {
    mcpServers: {
      "my-api": {
        command: "node",
        args: [
          "-e",
          "console.log('SSE connection for Claude Desktop requires a local bridge script in this version.')"
        ],
        env: {
          MCP_API_KEY: apiKey
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Banner */}
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-2xl p-6 sm:p-8 transition-colors shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="bg-green-500 rounded-full p-1.5 shrink-0 sm:mt-1">
             <Check className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400 mb-2">Successfully Deployed!</h2>
            <p className="text-green-700 dark:text-green-300 mb-6 text-sm sm:text-base">
              Your MCP server is live with {selectedEndpoints.size} endpoints. Copy the configuration below to connect your AI client.
            </p>
            
            <div className="relative w-full">
              <label className="text-sm font-medium text-green-800 dark:text-green-400 mb-1.5 block">Server URL</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={serverUrl}
                  className="w-full bg-white dark:bg-green-950/50 border border-green-200 dark:border-green-800/80 rounded-xl px-4 py-3 text-[#141B41] dark:text-green-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-colors"
                />
                <button 
                  onClick={() => copyToClipboard(serverUrl, setCopiedUrl)}
                  className="px-6 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-800 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300 font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  {copiedUrl ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedUrl ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Snippets */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 transition-colors shadow-sm">
        <h3 className="text-2xl font-semibold text-[#141B41] dark:text-white mb-2">Client Configuration Snippets</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Choose your AI client and copy the configuration:</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('cursor')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'cursor' ? 'bg-[#141B41] text-white dark:bg-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
          >
            <Pointer className="w-4 h-4" /> Cursor IDE
          </button>
          <button
            onClick={() => setActiveTab('cline')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'cline' ? 'bg-[#141B41] text-white dark:bg-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
          >
            <Code className="w-4 h-4" /> Cline (VS Code)
          </button>
          <button
            onClick={() => setActiveTab('claude')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'claude' ? 'bg-[#141B41] text-white dark:bg-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
          >
            <Terminal className="w-4 h-4" /> Claude Desktop
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">

          {/* CURSOR IDE TAB */}
          {activeTab === 'cursor' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-medium text-[#141B41] dark:text-white flex items-center gap-3">
                  Cursor Configuration
                  <a href="https://cursor.com/" target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1 font-normal bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md transition-colors">
                    <Download className="h-3 w-3" /> Get App
                  </a>
                </h4>
                <button 
                  onClick={() => copyToClipboard(serverUrl, setCopiedSnippet)}
                  className="text-sm flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#141B41] dark:text-slate-300 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {copiedSnippet ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copiedSnippet ? 'Copied URL!' : 'Copy Server URL'}
                </button>
              </div>

              <ol className="list-decimal list-inside text-sm text-[#141B41]/80 dark:text-slate-300 mb-4 space-y-1.5 ml-1">
                <li>Open Cursor Settings <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700">⌘ + Shift + J</code></li>
                <li>Go to <strong>Features</strong> &gt; <strong>MCP</strong></li>
                <li>Click <strong>+ Add New MCP Server</strong></li>
                <li>Set Type to <strong className="text-blue-600 dark:text-blue-400">sse</strong> and Name to <strong>my-api</strong></li>
                <li>Paste your server URL below:</li>
              </ol>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">SSE URL</span>
                </div>
                <pre className="p-4 sm:p-6 text-sm font-mono text-[#141B41] dark:text-blue-100 overflow-x-auto whitespace-pre-wrap break-all">
                  {serverUrl}
                </pre>
              </div>
            </div>
          )}

          {/* CLINE (VS CODE) TAB */}
          {activeTab === 'cline' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-medium text-[#141B41] dark:text-white flex items-center gap-3">
                  Cline Configuration
                </h4>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Cline currently favors stdio connections over direct remote SSE. A local proxy script is required for full compatibility in V1.
              </div>
            </div>
          )}

          {/* CLAUDE DESKTOP TAB */}
          {activeTab === 'claude' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-medium text-[#141B41] dark:text-white flex items-center gap-3">
                  Claude Desktop Configuration
                </h4>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Claude Desktop strictly requires a local 'stdio' proxy to connect to a remote SSE server. Native SSE support is coming soon.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Deploy() {
  const navigate = useNavigate();
  
  // Safe context extraction
  let context: any = null;
  try { context = useApp(); } catch(e) {}
  
  if (!context) {
    return <div className="p-20 text-center text-slate-500">Initializing workspace...</div>;
  }

  const { selectedEndpoints, endpoints, credentials, deploymentInfo, setDeploymentInfo, setLogs } = context;
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<React.ReactNode | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

    if (!baseUrl.trim()) {
      setDeployError("Please enter a Target API Base URL.");
      setIsDeploying(false);
      return;
    }

    try {
      const apiKeyToUse = credentials.length > 0 ? credentials[0].key : 'no-key-provided';
      
      const selectedEndpointDetails = endpoints.filter((ep: any) => 
        selectedEndpoints.has(`${ep.method}:${ep.path}`)
      );

      const targetUrl = 'https://mcp-proxy-backend.onrender.com/api/deploy';
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeyToUse,
          endpoints: selectedEndpointDetails,
          baseUrl: baseUrl.trim() 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      setDeploymentInfo({
        serverUrl: data.sseUrl,
        apiKey: apiKeyToUse, 
      });

      setLogs([
        {
          id: Math.random().toString(),
          timestamp: new Date(),
          level: 'info',
          endpoint: 'Server Deployment',
          statusCode: 200,
          message: `Successfully deployed MCP server with ID: ${data.serverId}`,
        },
      ]);

    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setDeployError(
          <div className="flex flex-col gap-2">
            <strong className="text-lg">Network Connection Refused!</strong>
            <p>Your browser could not reach the server at all. Try these steps:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
              <li><strong>Wake up the server:</strong> Render's free tier goes to sleep after 15 minutes. <a href="https://mcp-proxy-backend.onrender.com" target="_blank" rel="noreferrer" className="underline font-bold text-red-900 dark:text-red-300">Click here to open the URL in a new tab</a>. Wait for it to load, then come back and try deploying again.</li>
              <li><strong>Verify the URL:</strong> Ensure your code points to your exact live URL.</li>
            </ol>
          </div>
        );
      } else {
        setDeployError(`Deployment failed: ${error.message}`);
      }
    } finally {
      setIsDeploying(false);
    }
  };

  if (selectedEndpoints.size === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800 dark:text-yellow-200">You must select at least one endpoint in the Prune step to deploy your MCP server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {deployError && (
          <div className="mb-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-red-800 dark:text-red-200">{deployError}</div>
          </div>
        )}
        
        {!deploymentInfo ? (
          <DeploymentPanel onDeploy={handleDeploy} isDeploying={isDeploying} baseUrl={baseUrl} setBaseUrl={setBaseUrl} />
        ) : (
          <DeploymentSuccess />
        )}
      </div>
    </div>
  );
}