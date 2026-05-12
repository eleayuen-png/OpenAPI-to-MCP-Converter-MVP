import React, { useState, createContext, useContext } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Server, 
  Globe, 
  Copy, 
  Check, 
  Loader2, 
  Terminal,
  ExternalLink,
  X
} from 'lucide-react';

/**
 * 🛑 PREVIEW BRIDGE
 * To fix the resolution errors in this browser preview, we've bundled a local context 
 * and a mock UpgradeModal directly within this file.
 * * ⚠️ FOR YOUR LOCAL PROJECT (VS CODE):
 * When copying this to your real project, delete the "Mock Logic" block 
 * and restore your real imports:
 * import { useApp } from '../context/AppContext';
 * import { UpgradeModal } from './UpgradeModal';
 */

// --- Mock Logic (For Preview Only) ---
const MockAppContext = createContext<any>(null);

const useApp = () => {
  const context = useContext(MockAppContext);
  if (!context) {
    // Fallback data for the browser preview environment
    return {
      selectedEndpoints: new Set(['GET:/pet/findByStatus', 'POST:/pet']),
      targetBaseUrl: 'https://petstore.swagger.io/v2',
      piiMasking: false,
      setPiiMasking: (v: boolean) => {},
      isPro: false,
      deploymentInfo: null,
      setDeploymentInfo: (v: any) => {}
    };
  }
  return context;
};

const UpgradeModal = ({ isOpen, onClose, featureName }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-[#141B41] dark:text-white mb-2 tracking-tight">Unlock {featureName}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Upgrade to a Pro workspace to mask sensitive data and deploy enterprise-grade MCP servers.
        </p>
        <button onClick={onClose} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          View Pro Plans
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
function DeploymentPanelContent() {
  const { 
    selectedEndpoints, 
    targetBaseUrl, 
    piiMasking, 
    setPiiMasking, 
    isPro,
    deploymentInfo,
    setDeploymentInfo
  } = useApp();

  const [isDeploying, setIsDeploying] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      // Pinging your actual Oregon Render Backend
      const response = await fetch('https://mcp-backend-q8y7.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpoints: Array.from(selectedEndpoints), 
          baseUrl: targetBaseUrl, 
          piiMasking: !!piiMasking 
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error("Deployment failed");

      setDeploymentInfo({
        serverUrl: data.sseUrl,
        apiKey: "mcp_studio_" + Math.random().toString(36).substr(2, 12),
        piiMasking: piiMasking
      });
    } catch (err) {
      console.error("Deployment failed", err);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Area */}
      <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Server className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-[#141B41] dark:text-white mb-2">Ready to Deploy</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You have selected <span className="font-bold text-blue-600">{selectedEndpoints?.size || 0}</span> endpoints.
        </p>
      </div>

      <div className="p-8 space-y-6">
        {/* Base URL Preview */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Target API Base URL</label>
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-mono text-slate-600 dark:text-slate-300">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{targetBaseUrl || 'https://api.example.com/v1'}</span>
          </div>
        </div>

        {/* 🚩 PII REDACTION TOGGLE UI */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${piiMasking && isPro ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {piiMasking && isPro ? <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <ShieldAlert className="w-4 h-4 text-slate-400" />}
              <span className="font-bold text-xs text-[#141B41] dark:text-white uppercase tracking-wider">PII Redaction</span>
            </div>
            <button 
              onClick={() => {
                if (!isPro) {
                  setShowUpgradeModal(true);
                } else {
                  setPiiMasking(!piiMasking);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${piiMasking && isPro ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${piiMasking && isPro ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pr-8">
            Automatically masks emails, phone numbers, and IP addresses in API responses. {!isPro && <span className="text-blue-500 font-bold ml-1 cursor-pointer hover:underline" onClick={() => setShowUpgradeModal(true)}>Unlock Pro.</span>}
          </p>
        </div>

        {/* Action Button */}
        {!deploymentInfo ? (
          <button
            onClick={handleDeploy}
            disabled={isDeploying || (selectedEndpoints?.size === 0)}
            className="w-full py-4 bg-[#141B41] dark:bg-blue-600 hover:opacity-90 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Provisioning MCP Gateway...
              </>
            ) : (
              'Deploy MCP Server'
            )}
          </button>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
             <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-2xl flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-green-700 dark:text-green-400">Server Successfully Deployed</span>
             </div>
             
             <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden relative group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection URL</span>
                  </div>
                  <button onClick={() => copyToClipboard(deploymentInfo.serverUrl)} className="text-slate-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="font-mono text-xs text-blue-100 break-all select-all pr-4">
                  {deploymentInfo.serverUrl}
                </div>
             </div>

             <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => window.open('https://modelcontextprotocol.io', '_blank')}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                  Documentation <ExternalLink size={14} />
                </button>
                <button 
                  onClick={() => setDeploymentInfo(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
                >
                  Configure New
                </button>
             </div>
          </div>
        )}
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="PII Redaction" 
      />
    </div>
  );
}

// Default export wrapper for provider
export default function DeploymentPanel() {
  const [piiMasking, setPiiMasking] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);

  return (
    <MockAppContext.Provider value={{ 
      selectedEndpoints: new Set(['GET:/pet/findByStatus']),
      targetBaseUrl: 'https://petstore.swagger.io/v2',
      piiMasking,
      setPiiMasking,
      isPro: false,
      deploymentInfo,
      setDeploymentInfo
    }}>
      <DeploymentPanelContent />
    </MockAppContext.Provider>
  );
}