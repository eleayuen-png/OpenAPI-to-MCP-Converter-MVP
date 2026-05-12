import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  Auth,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  Firestore
} from 'firebase/firestore';
import { 
  AlertCircle, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  Code, 
  Pointer,
  Shield,
  ShieldAlert,
  RefreshCw,
  X,
  Zap,
  ArrowRight,
  Loader2,
  Terminal,
  ExternalLink,
  Laptop
} from 'lucide-react';

// --- 1. FIREBASE INITIALIZATION ---

const localFirebaseConfig = {
  apiKey: "AIzaSyB0Px3NSulFTBj8GeLrET1itIpJJovnN48",
  authDomain: "mcp-studio-22971.firebaseapp.com",
  projectId: "mcp-studio-22971",
  storageBucket: "mcp-studio-22971.firebasestorage.app",
  messagingSenderId: "1096681882291",
  appId: "1:1096681882291:web:9452e01ee86294b33ee6c6",
  measurementId: "G-8HBCC81VHB"
};

declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : localFirebaseConfig;
  firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (e) {
  console.error("Firebase Initialization Failure:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'mcp-studio-v1';

// --- 2. TYPES ---

export interface Endpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  category: string;
  tags?: string[];
}

export interface DeploymentInfo {
  serverUrl: string;
  apiKey: string;
  piiMasking?: boolean;
}

// --- 3. CONTEXT DEFINITION ---

interface AppContextType {
  endpoints: Endpoint[];
  setEndpoints: (val: Endpoint[]) => void;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (val: Set<string>) => void;
  deploymentInfo: DeploymentInfo | null;
  setDeploymentInfo: (info: DeploymentInfo | null) => void;
  piiMasking: boolean;
  setPiiMasking: (enabled: boolean) => void;
  isPro: boolean;
  targetBaseUrl: string;
  setTargetBaseUrl: (url: string) => void;
  syncing: boolean;
  user: User | null;
  resetWorkspace: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// --- 4. UI COMPONENTS ---

export function UpgradeModal({ isOpen, onClose, featureName }: { isOpen: boolean, onClose: () => void, featureName: string }) {
  const { user } = useApp();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    const userId = user?.uid || 'guest-session';
    const stripePaymentLink = `https://buy.stripe.com/test_6oU00jbfRcjV2Vk97Sew800?client_reference_id=${userId}`;
    window.location.href = stripePaymentLink;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-400 fill-blue-400" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <h3 className="text-2xl font-bold text-[#141B41] dark:text-white mb-2 tracking-tight">Upgrade to Pro</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The <span className="font-semibold text-[#141B41] dark:text-slate-200">{featureName}</span> feature is exclusive to MCP Studio Pro users.
        </p>
        
        <button 
          onClick={handleUpgradeClick}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
        >
          Upgrade Now — $19/mo
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">Secure payment via Stripe</p>
      </div>
    </div>
  );
}

export function DeploymentPanel({ onDeploy, isDeploying, baseUrl, setBaseUrl }: { onDeploy: () => void, isDeploying: boolean, baseUrl: string, setBaseUrl: (url: string) => void }) {
  const { selectedEndpoints, piiMasking, setPiiMasking, isPro, syncing } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-8 sm:p-12 text-center transition-colors shadow-sm flex flex-col items-center">
      <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
        <Server className="h-10 w-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight text-center">Ready to Deploy</h2>
      
      <div className="min-h-[40px] flex items-center justify-center mb-8">
        {syncing ? (
          <div className="flex items-center gap-2 text-blue-500 font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing project state...</span>
          </div>
        ) : (
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-center">
            You have selected <span className="text-blue-400 font-bold">{selectedEndpoints.size}</span> endpoints. We will securely deploy an MCP gateway instance for your agent.
          </p>
        )}
      </div>

      <div className="w-full max-w-md mb-8 space-y-6 text-left">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">API Base URL</label>
          <input 
            type="url" 
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)} 
            placeholder="https://api.example.com/v1"
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700" 
          />
        </div>

        <div className={`p-4 rounded-xl border transition-all ${piiMasking ? 'bg-blue-900/20 border-blue-800' : 'bg-slate-900/50 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {piiMasking ? <Shield className="w-4 h-4 text-blue-400" /> : <ShieldAlert className="w-4 h-4 text-slate-500" />}
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">PII Redaction</span>
            </div>
            <button 
              onClick={() => isPro ? setPiiMasking(!piiMasking) : setShowUpgradeModal(true)} 
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${piiMasking ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${piiMasking ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Automatically masks emails and phone numbers in responses. {!isPro && <span className="text-blue-500 font-bold ml-1">PRO</span>}</p>
        </div>
      </div>

      <button 
        onClick={onDeploy} 
        disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim() || syncing} 
        className="w-full max-w-md px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
      >
        {isDeploying ? <><Loader2 className="w-4 h-4 animate-spin" /> Deploying Gateway...</> : 'Deploy MCP Server'}
      </button>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="PII Data Masking" />
    </div>
  );
}

export function DeploymentSuccess({ info, count }: { info: DeploymentInfo, count: number }) {
  const { setDeploymentInfo } = useApp();
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'cline' | 'claude'>('cursor');
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(info.serverUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const cursorSnippet = JSON.stringify({
    "mcpServers": {
      "mcp-studio-proxy": {
        "type": "sse",
        "url": info.serverUrl
      }
    }
  }, null, 2);

  const claudeSnippet = JSON.stringify({
    "mcpServers": {
      "mcp-studio-proxy": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sse", info.serverUrl]
      }
    }
  }, null, 2);

  const steps = {
    cursor: [
      "Open Cursor Settings (Cmd+Shift+J / Ctrl+Shift+J)",
      "Navigate to 'Models' then 'MCP'",
      "Click '+ Add New MCP Server'",
      "Name it 'mcp-studio', choose 'SSE' as type",
      "Paste the Server URL or the JSON snippet"
    ],
    cline: [
      "Open Cline settings in your IDE",
      "Scroll to the 'MCP Servers' section",
      "Click 'Add Server'",
      "Select 'SSE' and paste the URL",
      "Save and enable the new server"
    ],
    claude: [
      "Locate your Claude Desktop config file",
      "Mac: ~/Library/Application Support/Claude/claude_desktop_config.json",
      "Windows: %APPDATA%/Claude/claude_desktop_config.json",
      "Paste the JSON snippet on the right into the 'mcpServers' object",
      "Restart Claude Desktop"
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Main Success Banner */}
      <div className="bg-green-900/10 border border-green-900/50 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Deployment Successful!</h2>
        <p className="text-slate-400 mb-6">Your MCP server is live with {count} active tools.</p>
        
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-blue-400 overflow-hidden text-ellipsis whitespace-nowrap text-left">
            {info.serverUrl}
          </div>
          <button 
            onClick={handleCopyUrl} 
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-all shadow-sm active:scale-95"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>

      {/* 2. Redeploy Button (As requested, box is placed below this) */}
      <div className="flex justify-center">
        <button 
          onClick={() => setDeploymentInfo(null)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Modify configuration & redeploy
        </button>
      </div>

      {/* 3. Snippets Instruction Box (Restored with Split View) */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-[#161e2e]">
          {(['cursor', 'cline', 'claude'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'cursor' ? 'Cursor IDE' : tab === 'cline' ? 'Cline' : 'Claude Desktop'}
            </button>
          ))}
        </div>

        {/* Content Split View */}
        <div className="flex flex-col lg:flex-row min-h-[300px]">
          {/* Left: Steps */}
          <div className="lg:w-1/3 p-6 border-r border-slate-800 bg-slate-900/30">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Pointer className="w-4 h-4 text-blue-400" />
              Installation Steps
            </h3>
            <ul className="space-y-4">
              {steps[activeTab].map((step, idx) => (
                <li key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-400">
                  <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-800 border border-slate-700 text-blue-400 font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Code */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Snippet</span>
              </div>
              <button 
                onClick={() => handleCopySnippet(activeTab === 'claude' ? claudeSnippet : cursorSnippet)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
              >
                {copiedSnippet ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Snippet</>}
              </button>
            </div>
            <div className="flex-1 bg-black/40 border border-slate-800 rounded-xl p-4 overflow-hidden relative group">
              <pre className="text-[11px] font-mono text-blue-100 h-full overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {activeTab === 'claude' ? claudeSnippet : cursorSnippet}
              </pre>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 italic">
              <Terminal className="w-3 h-3" />
              {activeTab === 'claude' ? 'Paste this into your main config file.' : 'Add this as a new server in settings.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. MAIN DEPLOY PAGE ---

export function Deploy() {
  const { selectedEndpoints, endpoints, deploymentInfo, setDeploymentInfo, piiMasking, targetBaseUrl, user, resetWorkspace } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(targetBaseUrl || 'https://petstore.swagger.io/v2');

  useEffect(() => { 
    if (targetBaseUrl) setBaseUrl(targetBaseUrl); 
  }, [targetBaseUrl]);

  const handleDeploy = async () => {
    if (!user || !db) { 
      setDeployError("Authentication incomplete. Please wait for session to initialize."); 
      return; 
    }
    
    setIsDeploying(true);
    setDeployError(null);

    try {
      const selectedDetails = endpoints.filter(ep => selectedEndpoints.has(`${ep.method}:${ep.path}`));
      
      const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      
      await setDoc(projectRef, { 
        piiMasking: !!piiMasking, 
        targetBaseUrl: baseUrl.trim(),
        deploymentInfo: {
          serverUrl: `https://mcp-proxy-backend.onrender.com/sse/pending`,
          apiKey: 'vault-key',
          piiMasking: !!piiMasking
        }
      }, { merge: true });
      
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpoints: selectedDetails, 
          baseUrl: baseUrl.trim(), 
          piiMasking: !!piiMasking 
        })
      });
      
      if (!response.ok) throw new Error("Gateway deployment failed. Check connectivity.");
      
      const data = await response.json();
      const newDeployInfo = { 
        serverUrl: data.sseUrl, 
        apiKey: 'vault-key', 
        piiMasking: !!piiMasking 
      };

      setDeploymentInfo(newDeployInfo);
      await setDoc(projectRef, { deploymentInfo: newDeployInfo }, { merge: true });
      
    } catch (error: any) {
      setDeployError(error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-700">
      {deployError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /> 
          <div>
             <p className="font-bold mb-0.5">Deployment Error</p>
             <p className="font-mono text-[10px] opacity-70 break-all">{deployError}</p>
          </div>
        </div>
      )}
      {!deploymentInfo ? (
        <DeploymentPanel onDeploy={handleDeploy} isDeploying={isDeploying} baseUrl={baseUrl} setBaseUrl={setBaseUrl} />
      ) : (
        <DeploymentSuccess info={deploymentInfo} count={selectedEndpoints.size} />
      )}
    </div>
  );
}

// --- 6. ROOT APPLICATION ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMasking] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('');
  const [syncing, setSyncing] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth error", e);
      } finally {
        setIsInitialLoad(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setSyncing(true);
    
    const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    
    const unsubscribe = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.targetBaseUrl) setTargetBaseUrl(data.targetBaseUrl);
        if (data.piiMasking !== undefined) setPiiMasking(data.piiRedaction || data.piiMasking || false);
        if (data.isPro !== undefined) setIsPro(data.isPro);
        
        if (Array.isArray(data.selectedEndpoints)) {
          setSelectedEndpoints(new Set(data.selectedEndpoints));
        } else if (data.selectedEndpoints && typeof data.selectedEndpoints === 'object') {
           const selection = new Set<string>();
           Object.entries(data.selectedEndpoints).forEach(([k, v]) => { if (v) selection.add(k); });
           setSelectedEndpoints(selection);
        }
        
        if (data.endpoints) setEndpoints(data.endpoints);
        if (data.deploymentInfo) setDeploymentInfo(data.deploymentInfo);
      }
      setSyncing(false);
    }, (err) => {
      console.error("Data sync error:", err);
      setSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetWorkspace = async () => {
    if (!user || !db) return;
    const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    await setDoc(projectRef, {
      endpoints: [],
      selectedEndpoints: [],
      targetBaseUrl: '',
      piiMasking: false,
      deploymentInfo: null
    }, { merge: true });
    setEndpoints([]);
    setSelectedEndpoints(new Set());
    setDeploymentInfo(null);
    setTargetBaseUrl('');
  };

  const contextValue = { 
    endpoints, setEndpoints: (val: Endpoint[]) => setEndpoints(val), selectedEndpoints, setSelectedEndpoints, deploymentInfo, setDeploymentInfo, 
    piiMasking, setPiiMasking, isPro, targetBaseUrl, setTargetBaseUrl, syncing, user, resetWorkspace 
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-wide">Initializing session...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#020617] text-slate-200">
        <Deploy />
      </div>
    </AppContext.Provider>
  );
}