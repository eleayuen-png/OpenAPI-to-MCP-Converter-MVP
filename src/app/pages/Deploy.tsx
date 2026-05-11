import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  AlertCircle, 
  Server, 
  CheckCircle2, 
  Copy, 
  Download, 
  Terminal, 
  Check, 
  Code, 
  Pointer,
  ExternalLink
} from 'lucide-react';

// @ts-ignore - Using the relative path that successfully resolved in MacroTools
import { useApp } from '../../context/AppContext';

// --- Helper Components ---

export function DeploymentPanel({ 
  onDeploy, 
  isDeploying, 
  baseUrl, 
  setBaseUrl 
}: { 
  onDeploy: () => void, 
  isDeploying: boolean, 
  baseUrl: string, 
  setBaseUrl: (url: string) => void 
}) {
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
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <Info size={12} /> This is the real API address your proxy will talk to.
        </p>
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
  let context: any = null;
  try { context = useApp(); } catch(e) {}
  const deploymentInfo = context?.deploymentInfo;
  const selectedEndpoints = context?.selectedEndpoints || new Set();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  
  if (!deploymentInfo) return null;

  const serverUrl = deploymentInfo.serverUrl || '';
  
  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 transition-colors shadow-sm">
        <h3 className="text-2xl font-semibold text-[#141B41] dark:text-white mb-6 tracking-tight flex items-center gap-2">
           <Pointer className="text-blue-500" /> Connect to Cursor IDE
        </h3>
        
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm">Follow these steps to enable your tools in Cursor:</p>
            <button 
              onClick={() => copyToClipboard(serverUrl, setCopiedSnippet)}
              className="text-sm flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#141B41] dark:text-slate-300 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
            >
              {copiedSnippet ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
              {copiedSnippet ? 'Copied URL!' : 'Copy Server URL'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">1</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                  Open Cursor Settings using <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">⌘ + Shift + J</kbd>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                  Navigate to <strong>Features</strong> &gt; <strong>MCP</strong> in the sidebar.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                  Click <strong>+ Add New MCP Server</strong>.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">4</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                  Set Type to <strong className="text-blue-500">sse</strong>, Name to <strong>my-api</strong>, and paste the URL.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <h5 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Preview URL</h5>
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-xs text-blue-600 dark:text-blue-400 break-all">
                {serverUrl}
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                   <ExternalLink size={14} className="shrink-0 mt-0.5" />
                   Once connected, just ask Cursor: "Use the my-api tool to fetch the pet inventory."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Deploy Component ---

export default function Deploy() {
  const navigate = useNavigate();
  
  const context = useApp() as any;
  const { 
    selectedEndpoints, 
    endpoints, 
    credentials, 
    macros, 
    deploymentInfo, 
    setDeploymentInfo, 
    setLogs 
  } = context;

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<React.ReactNode | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://petstore.swagger.io/v2');

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

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
          baseUrl: baseUrl.trim(),
          macros: macros || [] // Ensure we send an empty array if no macros exist
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deployment failed: ${errorText}`);
      }

      const data = await response.json();

      setDeploymentInfo({
        serverUrl: data.sseUrl,
        apiKey: apiKeyToUse, 
      });

      if (setLogs) {
        setLogs((prev: any) => [
          {
            id: Math.random().toString(),
            timestamp: new Date(),
            level: 'info',
            endpoint: 'Deployment',
            statusCode: 200,
            message: `Successfully deployed MCP server with ${selectedEndpointDetails.length} tools and ${(macros || []).length} macros.`,
          },
          ...prev
        ]);
      }

    } catch (error: any) {
      setDeployError(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {deployError && (
          <div className="mb-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-3 transition-colors shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-red-800 dark:text-red-200 text-sm">{deployError}</div>
          </div>
        )}
        
        {!deploymentInfo ? (
          <DeploymentPanel 
            onDeploy={handleDeploy} 
            isDeploying={isDeploying} 
            baseUrl={baseUrl} 
            setBaseUrl={setBaseUrl} 
          />
        ) : (
          <DeploymentSuccess />
        )}
      </div>
    </div>
  );
}

// Simple Info icon replacement if lucide import is messy
function Info({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}