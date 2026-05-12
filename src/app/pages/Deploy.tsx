import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
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
  ExternalLink,
  Shield,
  ShieldAlert,
  Info,
  RefreshCw,
  X,
  Zap,
  ArrowRight
} from 'lucide-react';

// --- Types ---

export interface Endpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  category: string;
  tags?: string[];
}

export interface MacroTool {
  id: string;
  name: string;
  description: string;
  steps: Array<{ method: string; path: string; }>;
}

export interface DeploymentInfo {
  serverUrl: string;
  apiKey: string;
  piiMasking?: boolean;
}

// --- Context Definition (Integrated to fix resolution errors) ---

interface AppContextType {
  endpoints: Endpoint[];
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (val: Set<string>) => void;
  deploymentInfo: DeploymentInfo | null;
  setDeploymentInfo: (info: DeploymentInfo | null) => void;
  piiMasking: boolean;
  setPiiMasking: (enabled: boolean) => void;
  isPro: boolean;
  targetBaseUrl: string;
  setTargetBaseUrl: (url: string) => void;
  resetWorkspace: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// --- Components ---

/**
 * UpgradeModal Component
 * Provides the UI for encouraging Pro upgrades for PII Redaction.
 */
export function UpgradeModal({ isOpen, onClose, featureName }: { isOpen: boolean, onClose: () => void, featureName: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        <h3 className="text-2xl font-bold text-[#141B41] dark:text-white mb-2">Upgrade to Pro</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          The <span className="font-semibold text-[#141B41] dark:text-slate-200">{featureName}</span> feature is exclusive to MCP Studio Pro users.
        </p>

        <div className="space-y-4 mb-8">
          {[
            "PII Data Redaction & Masking",
            "Unlimited Macro Tool Bundles",
            "Custom SSE Persistence",
            "Priority API Support"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <button className="w-full py-4 bg-[#141B41] dark:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]">
          Upgrade Now — $19/mo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * DeploymentPanel Component
 * Handles the configuration and trigger for deployment.
 */
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
  const { selectedEndpoints, piiMasking, setPiiMasking, isPro } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors">
      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Server className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-[#141B41] dark:text-white mb-4">Ready to Deploy</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
        You have selected {selectedEndpoints.size} endpoints. We will securely deploy an MCP server configuration that proxies requests through your provided credentials.
      </p>

      <div className="max-w-md mx-auto mb-8 space-y-6 text-left">
        <div>
          <label className="text-sm font-medium text-[#141B41] dark:text-slate-300 mb-1.5 block">Target API Base URL</label>
          <input 
            type="url" 
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="e.g., https://api.example.com/v1"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#141B41] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className={`p-4 rounded-xl border transition-all ${piiMasking ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {piiMasking ? <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <ShieldAlert className="w-4 h-4 text-slate-400" />}
              <span className="font-semibold text-xs text-[#141B41] dark:text-white uppercase tracking-wider">PII Redaction</span>
            </div>
            <button 
              onClick={() => {
                if (!isPro) {
                  setShowUpgradeModal(true);
                } else {
                  setPiiMasking(!piiMasking);
                }
              }}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${piiMasking ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${piiMasking ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Automatically masks emails and phone numbers in responses before they reach the LLM. {!isPro && <span className="text-blue-500 font-medium ml-1">Pro Feature.</span>}
          </p>
        </div>
      </div>

      <button
        onClick={onDeploy}
        disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim()}
        className="px-8 py-3.5 bg-[#141B41] hover:bg-[#1a2352] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
      >
        {isDeploying ? 'Deploying Server...' : 'Deploy MCP Server'}
      </button>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="PII Data Masking" 
      />
    </div>
  );
}

/**
 * DeploymentSuccess Component
 * Displays success metrics and snippets. 
 * Includes the CRITICAL "Redeploy" safeguard.
 */
export function DeploymentSuccess() {
  const { deploymentInfo, setDeploymentInfo, selectedEndpoints } = useApp();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'cline' | 'claude'>('cursor');
  
  if (!deploymentInfo) return null;

  const serverUrl = deploymentInfo.serverUrl || '';
  
  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    // Clipboard fallback for browser constraints
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const cursorSnippet = JSON.stringify({
    mcpServers: {
      "mcp-studio-proxy": {
        "type": "sse",
        "url": serverUrl
      }
    }
  }, null, 2);

  const claudeConfig = JSON.stringify({
    "mcpServers": {
      "mcp-studio-proxy": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sse", serverUrl]
      }
    }
  }, null, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-2xl p-6 sm:p-8 transition-colors shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="bg-green-500 rounded-full p-1.5 shrink-0 sm:mt-1">
             <Check className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400">Successfully Deployed!</h2>
              {deploymentInfo.piiMasking && (
                <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  <Shield size={10} /> PII Masking Active
                </span>
              )}
            </div>
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

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(['cursor', 'cline', 'claude'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'cursor' ? 'Cursor IDE' : tab === 'cline' ? 'Cline' : 'Claude Desktop'}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#141B41] dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              Configuration Snippet
            </h3>
            <button 
              onClick={() => copyToClipboard(
                activeTab === 'cursor' ? cursorSnippet : activeTab === 'cline' ? cursorSnippet : claudeConfig, 
                setCopiedSnippet
              )}
              className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              {copiedSnippet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSnippet ? 'Copied to Clipboard' : 'Copy Snippet'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden relative group">
            <pre className="text-blue-100 font-mono text-sm overflow-x-auto custom-scrollbar">
              {activeTab === 'cursor' ? cursorSnippet : activeTab === 'cline' ? cursorSnippet : claudeConfig}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-start gap-3">
            <Pointer className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeTab === 'cursor' && "Open Cursor Settings > Models > MCP, click 'Add New MCP Server', choose 'SSE' as type, and paste the URL above."}
              {activeTab === 'cline' && "Open Cline settings, navigate to the MCP section, and add a new SSE configuration with the URL provided."}
              {activeTab === 'claude' && "Open your Claude Desktop configuration file and paste this JSON block into the 'mcpServers' section."}
            </p>
          </div>
        </div>
      </div>

      {/* 🚀 REDEPLOY SAFEGUARD (Root Cause Fix) */}
      <div className="flex flex-col items-center justify-center pt-8 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setDeploymentInfo(null)}
          className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-[#141B41] dark:hover:text-white transition-colors font-medium group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          Modify configuration & redeploy new instance
        </button>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
          Invalidates current session key
        </p>
      </div>
    </div>
  );
}

/**
 * Main Deploy Page Component
 */
export function Deploy() {
  const { 
    selectedEndpoints, 
    endpoints, 
    deploymentInfo, 
    setDeploymentInfo, 
    piiMasking,
    targetBaseUrl 
  } = useApp();

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(targetBaseUrl || 'https://petstore.swagger.io/v2');

  useEffect(() => {
    if (targetBaseUrl) setBaseUrl(targetBaseUrl);
  }, [targetBaseUrl]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

    try {
      const selectedEndpointDetails = endpoints.filter((ep: any) => 
        selectedEndpoints.has(`${ep.method}:${ep.path}`)
      );

      // Deployment API call
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'test-api-key', // In real app, from context
          endpoints: selectedEndpointDetails,
          baseUrl: baseUrl.trim(),
          macros: [],
          piiMasking: !!piiMasking 
        })
      });

      if (!response.ok) throw new Error(`Deployment failed: ${response.statusText}`);

      const data = await response.json();

      setDeploymentInfo({
        serverUrl: data.sseUrl,
        apiKey: 'test-api-key', 
        piiMasking: !!piiMasking
      });

    } catch (error: any) {
      setDeployError(error.message);
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

// --- Entry Point Wrapper (Fixes resolution errors for the Wizard) ---

export default function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMasking] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('');

  const resetWorkspace = async () => {
    setEndpoints([]);
    setSelectedEndpoints(new Set());
    setDeploymentInfo(null);
    setTargetBaseUrl('');
  };

  const contextValue: AppContextType = {
    endpoints,
    selectedEndpoints,
    setSelectedEndpoints,
    deploymentInfo,
    setDeploymentInfo,
    piiMasking,
    setPiiMasking,
    isPro: true, // Assuming Pro for demo
    targetBaseUrl,
    setTargetBaseUrl,
    resetWorkspace
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Deploy />
    </AppContext.Provider>
  );
}