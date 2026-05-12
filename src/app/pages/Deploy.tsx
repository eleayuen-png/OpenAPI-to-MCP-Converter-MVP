import React, { createContext, useContext, useState, useEffect } from 'react';
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
  updateDoc,
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
  Loader2
} from 'lucide-react';

// --- Firebase 安全初始化 ---
let app: FirebaseApp | undefined, auth: Auth | undefined, db: Firestore | undefined;
const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : null;

try {
  if (!rawConfig) {
    throw new Error("Firebase configuration string is missing.");
  }
  const firebaseConfig = JSON.parse(rawConfig);
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing in the configuration.");
  }
  
  // 確保只初始化一次
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Failure:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Types ---

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

// --- Context Definition ---

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
  syncing: boolean;
  user: User | null;
  configError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// --- UI Components ---

export function UpgradeModal({ isOpen, onClose, featureName }: { isOpen: boolean, onClose: () => void, featureName: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-400 fill-blue-400" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">升級至 Pro</h3>
        <p className="text-slate-400 mb-8">
          <span className="font-semibold text-slate-200">{featureName}</span> 功能為 MCP Studio Pro 用戶專屬。
        </p>
        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all">
          立即升級 — $19/月
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DeploymentPanel({ onDeploy, isDeploying, baseUrl, setBaseUrl }: { onDeploy: () => void, isDeploying: boolean, baseUrl: string, setBaseUrl: (url: string) => void }) {
  const { selectedEndpoints, piiMasking, setPiiMasking, isPro, syncing } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-8 sm:p-12 text-center transition-colors">
      <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Server className="h-10 w-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-4">準備部署</h2>
      <div className="min-h-[40px] flex items-center justify-center mb-8">
        {syncing ? (
          <div className="flex items-center gap-2 text-blue-500 font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在從雲端同步狀態...</span>
          </div>
        ) : (
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
            您目前已選擇了 <span className="text-blue-400 font-bold">{selectedEndpoints.size}</span> 個端點。我們將為您部署一個安全代理伺服器。
          </p>
        )}
      </div>
      <div className="max-w-md mx-auto mb-8 space-y-6 text-left">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">目標 API 基礎網址</label>
          <input 
            type="url" 
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)} 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
          />
        </div>
        <div className={`p-4 rounded-xl border ${piiMasking ? 'bg-blue-900/20 border-blue-800' : 'bg-slate-900/50 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${piiMasking ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">PII 數據脫敏</span>
            </div>
            <button 
              onClick={() => isPro ? setPiiMasking(!piiMasking) : setShowUpgradeModal(true)} 
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${piiMasking ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${piiMasking ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">自動遮蔽響應中的機敏個資（Email/電話）。</p>
        </div>
      </div>
      <button 
        onClick={onDeploy} 
        disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim() || syncing} 
        className="w-full max-w-md px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {isDeploying ? <><Loader2 className="w-4 h-4 animate-spin" /> 部署中...</> : '部署 MCP 伺服器'}
      </button>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="PII 數據遮蔽" />
    </div>
  );
}

export function DeploymentSuccess({ info, count }: { info: DeploymentInfo, count: number }) {
  const [copied, setCopied] = useState(false);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-green-900/10 border border-green-900/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">部署成功！</h2>
        <p className="text-slate-400 mb-6">您的伺服器已上線（包含 {count} 個端點）。</p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input readOnly value={info.serverUrl} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-blue-400" />
          <button 
            onClick={() => { navigator.clipboard.writeText(info.serverUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
            className="px-6 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-all"
          >
            {copied ? '已複製' : '複製'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Deploy() {
  const { selectedEndpoints, endpoints, deploymentInfo, setDeploymentInfo, piiMasking, targetBaseUrl, user, configError } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(configError);
  const [baseUrl, setBaseUrl] = useState(targetBaseUrl || 'https://petstore.swagger.io/v2');

  useEffect(() => { if (targetBaseUrl) setBaseUrl(targetBaseUrl); }, [targetBaseUrl]);

  const handleDeploy = async () => {
    if (!user || !db) { setDeployError("請確認身份驗證已完成。"); return; }
    setIsDeploying(true);
    setDeployError(null);
    try {
      const selectedDetails = endpoints.filter(ep => selectedEndpoints.has(`${ep.method}:${ep.path}`));
      const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
      
      await updateDoc(projectRef, { 
        piiRedaction: !!piiMasking, 
        baseUrl: baseUrl.trim(),
        lastDeployed: new Date().toISOString()
      });
      
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: selectedDetails, baseUrl: baseUrl.trim(), piiMasking: !!piiMasking })
      });
      
      if (!response.ok) throw new Error("部署網關響應錯誤");
      const data = await response.json();
      setDeploymentInfo({ serverUrl: data.sseUrl, apiKey: 'key', piiMasking: !!piiMasking });
    } catch (error: any) {
      setDeployError(error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {deployError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" /> {deployError}
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

// --- Root Application Provider ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMasking] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('');
  const [syncing, setSyncing] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setConfigError("Firebase configuration (__firebase_config) is missing or invalid.");
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth initialization error", e);
        setConfigError("身份驗證初始化失敗，請檢查網路連線。");
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setSyncing(true);
    const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
    
    const unsubscribe = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTargetBaseUrl(data.baseUrl || '');
        setPiiMasking(data.piiRedaction || false);
        const selection = new Set<string>();
        if (data.selectedEndpoints) {
          Object.entries(data.selectedEndpoints).forEach(([k, v]) => { if (v) selection.add(k); });
        }
        setSelectedEndpoints(selection);
        if (data.endpoints) setEndpoints(data.endpoints);
      }
      setSyncing(false);
    }, (err) => {
      console.error("Data sync error", err);
      setSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const contextValue = { 
    endpoints, selectedEndpoints, setSelectedEndpoints, deploymentInfo, setDeploymentInfo, 
    piiMasking, setPiiMasking, isPro: true, targetBaseUrl, setTargetBaseUrl, syncing, user, configError 
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="bg-red-500/5 border border-red-500/20 p-10 rounded-3xl max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-4">配置錯誤</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{configError}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">
            重新整理頁面
          </button>
        </div>
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