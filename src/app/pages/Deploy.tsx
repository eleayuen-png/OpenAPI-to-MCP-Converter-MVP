import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  updateDoc
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

// --- Firebase 初始化與守衛 ---
let app, auth, db;
const firebaseConfigRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : null;

try {
  if (!firebaseConfigRaw) {
    throw new Error("Firebase configuration (__firebase_config) is missing.");
  }
  const firebaseConfig = JSON.parse(firebaseConfigRaw);
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
    throw new Error("Firebase API Key is invalid or undefined.");
  }
  
  // 確保只初始化一次
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Critical Error:", e);
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
  user: any;
  configError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// --- Components ---

export function UpgradeModal({ isOpen, onClose, featureName }: { isOpen: boolean, onClose: () => void, featureName: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <h3 className="text-2xl font-bold text-[#141B41] dark:text-white mb-2">升級至 Pro</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          <span className="font-semibold text-[#141B41] dark:text-slate-200">{featureName}</span> 功能為 MCP Studio Pro 用戶專屬。
        </p>
        <button className="w-full py-4 bg-[#141B41] dark:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]">
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
    <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors">
      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Server className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-[#141B41] dark:text-white mb-4">準備部署</h2>
      <div className="min-h-[40px] flex items-center justify-center mb-8">
        {syncing ? (
          <div className="flex items-center gap-2 text-blue-500 font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>同步雲端狀態中...</span>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            您目前已選擇了 {selectedEndpoints.size} 個端點。
          </p>
        )}
      </div>
      <div className="max-w-md mx-auto mb-8 space-y-6 text-left">
        <div>
          <label className="text-sm font-medium text-[#141B41] dark:text-slate-300 mb-1.5 block">目標 API 基礎網址</label>
          <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm" />
        </div>
        <div className={`p-4 rounded-xl border ${piiMasking ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${piiMasking ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-semibold text-xs uppercase tracking-wider">PII 數據脫敏</span>
            </div>
            <button onClick={() => isPro ? setPiiMasking(!piiMasking) : setShowUpgradeModal(true)} className={`relative inline-flex h-5 w-10 items-center rounded-full ${piiMasking ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${piiMasking ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
      <button onClick={onDeploy} disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim() || syncing} className="px-8 py-3.5 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 mx-auto flex items-center justify-center gap-2">
        {isDeploying ? '部署中...' : '部署 MCP 伺服器'}
      </button>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} featureName="PII 數據遮蔽" />
    </div>
  );
}

export function DeploymentSuccess() {
  const { deploymentInfo, setDeploymentInfo, selectedEndpoints } = useApp();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'cline' | 'claude'>('cursor');
  if (!deploymentInfo) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400 mb-2">部署成功！</h2>
        <p className="text-green-700 dark:text-green-300 mb-6 text-sm">您的伺服器已上線。</p>
        <div className="flex gap-2">
          <input readOnly value={deploymentInfo.serverUrl} className="flex-1 bg-white dark:bg-green-950/50 border border-green-200 rounded-xl px-4 py-3 text-sm font-mono" />
          <button onClick={() => { navigator.clipboard.writeText(deploymentInfo.serverUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }} className="px-6 py-3 bg-green-100 rounded-xl text-green-800 font-medium">
            {copiedUrl ? '已複製' : '複製'}
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center pt-8 border-t border-slate-200">
        <button onClick={() => setDeploymentInfo(null)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> 修改配置並重新部署
        </button>
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
    if (!user) { setDeployError("請登入後再進行部署。"); return; }
    setIsDeploying(true);
    setDeployError(null);
    try {
      const selectedDetails = endpoints.filter(ep => selectedEndpoints.has(`${ep.method}:${ep.path}`));
      const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
      await updateDoc(projectRef, { piiRedaction: !!piiMasking, baseUrl: baseUrl.trim() });
      
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: selectedDetails, baseUrl: baseUrl.trim(), piiMasking: !!piiMasking })
      });
      if (!response.ok) throw new Error("部署 API 響應錯誤");
      const data = await response.json();
      setDeploymentInfo({ serverUrl: data.sseUrl, apiKey: 'key', piiMasking: !!piiMasking });
    } catch (error: any) {
      setDeployError(error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {deployError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500" /> {deployError}
          </div>
        )}
        {!deploymentInfo ? <DeploymentPanel onDeploy={handleDeploy} isDeploying={isDeploying} baseUrl={baseUrl} setBaseUrl={setBaseUrl} /> : <DeploymentSuccess />}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMasking] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('');
  const [syncing, setSyncing] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) { setConfigError("Firebase Auth 尚未初始化。請檢查配置。"); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error", e); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setSyncing(true);
    const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
    return onSnapshot(projectRef, (snap) => {
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
    }, (err) => { console.error("Sync error", err); setSyncing(false); });
  }, [user]);

  const contextValue = { endpoints, selectedEndpoints, setSelectedEndpoints, deploymentInfo, setDeploymentInfo, piiMasking, setPiiMasking, isPro: true, targetBaseUrl, setTargetBaseUrl, syncing, user, configError };

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">配置錯誤</h2>
          <p className="text-red-400 text-sm">{configError}</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Deploy />
    </AppContext.Provider>
  );
}