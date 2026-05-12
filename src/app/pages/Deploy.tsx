import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
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

// --- Firebase 初始化 ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
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
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
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

        <div className="space-y-4 mb-8">
          {[
            "PII 數據脫敏與遮蔽",
            "無限量巨集工具組合",
            "自定義 SSE 持久化",
            "優先 API 技術支援"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <button className="w-full py-4 bg-[#141B41] dark:bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-[0.98]">
          立即升級 — $19/月
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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
            <span>同步選取狀態中...</span>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            您目前已選擇了 {selectedEndpoints.size} 個端點。我們將部署一個安全的 MCP 伺服器並透過您的憑證進行代理。
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto mb-8 space-y-6 text-left">
        <div>
          <label className="text-sm font-medium text-[#141B41] dark:text-slate-300 mb-1.5 block">目標 API 基礎網址 (Base URL)</label>
          <input 
            type="url" 
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="例如 https://api.example.com/v1"
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#141B41] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className={`p-4 rounded-xl border transition-all ${piiMasking ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {piiMasking ? <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <ShieldAlert className="w-4 h-4 text-slate-400" />}
              <span className="font-semibold text-xs text-[#141B41] dark:text-white uppercase tracking-wider">PII 數據脫敏</span>
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
            自動遮蔽響應中的電子郵件與電話。{!isPro && <span className="text-blue-500 font-medium ml-1">Pro 版功能。</span>}
          </p>
        </div>
      </div>

      <button
        onClick={onDeploy}
        disabled={isDeploying || selectedEndpoints.size === 0 || !baseUrl.trim() || syncing}
        className="px-8 py-3.5 bg-[#141B41] hover:bg-[#1a2352] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
      >
        {isDeploying ? '正在部署伺服器...' : syncing ? '等待同步...' : '部署 MCP 伺服器'}
      </button>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="PII 數據遮蔽" 
      />
    </div>
  );
}

export function DeploymentSuccess() {
  const { deploymentInfo, setDeploymentInfo, selectedEndpoints } = useApp();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'cline' | 'claude'>('cursor');
  
  if (!deploymentInfo) return null;

  const serverUrl = deploymentInfo.serverUrl || '';
  
  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const cursorSnippet = JSON.stringify({
    mcpServers: { "mcp-studio-proxy": { "type": "sse", "url": serverUrl } }
  }, null, 2);

  const claudeConfig = JSON.stringify({
    "mcpServers": {
      "mcp-studio-proxy": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sse", serverUrl] }
    }
  }, null, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="bg-green-500 rounded-full p-1.5 shrink-0">
             <Check className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-green-800 dark:text-green-400">部署成功！</h2>
              {deploymentInfo.piiMasking && (
                <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  <Shield size={10} /> PII 脫敏已啟用
                </span>
              )}
            </div>
            <p className="text-green-700 dark:text-green-300 mb-6 text-sm">
              您的 MCP 伺服器已上線（包含 {selectedEndpoints.size} 個端點）。
            </p>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input type="text" readOnly value={serverUrl} className="flex-1 bg-white dark:bg-green-950/50 border border-green-200 dark:border-green-800/80 rounded-xl px-4 py-3 text-sm font-mono" />
              <button onClick={() => copyToClipboard(serverUrl, setCopiedUrl)} className="px-6 py-3 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-800 dark:text-green-300 font-medium transition-colors flex items-center justify-center gap-2">
                {copiedUrl ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedUrl ? '已複製' : '複製 URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(['cursor', 'cline', 'claude'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}>
              {tab === 'cursor' ? 'Cursor IDE' : tab === 'cline' ? 'Cline' : 'Claude Desktop'}
            </button>
          ))}
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#141B41] dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              設定代碼片段
            </h3>
            <button onClick={() => copyToClipboard(activeTab === 'claude' ? claudeConfig : cursorSnippet, setCopiedSnippet)} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              {copiedSnippet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              複製片段
            </button>
          </div>
          <pre className="bg-slate-900 rounded-2xl p-6 text-blue-100 font-mono text-sm overflow-x-auto">
            {activeTab === 'claude' ? claudeConfig : cursorSnippet}
          </pre>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-8 border-t border-slate-200 dark:border-slate-800">
        <button onClick={() => setDeploymentInfo(null)} className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-white transition-colors group">
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          修改配置並重新部署
        </button>
      </div>
    </div>
  );
}

export function Deploy() {
  const { selectedEndpoints, endpoints, deploymentInfo, setDeploymentInfo, piiMasking, targetBaseUrl, user } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(targetBaseUrl || 'https://petstore.swagger.io/v2');

  useEffect(() => { if (targetBaseUrl) setBaseUrl(targetBaseUrl); }, [targetBaseUrl]);

  const handleDeploy = async () => {
    if (!user) { setDeployError("請先登入後再進行部署。"); return; }
    setIsDeploying(true);
    setDeployError(null);

    try {
      const selectedEndpointDetails = endpoints.filter(ep => selectedEndpoints.has(`${ep.method}:${ep.path}`));
      
      // 更新雲端狀態 (遵守規則 1)
      const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
      await updateDoc(projectRef, {
        status: 'deploying',
        piiRedaction: !!piiMasking,
        baseUrl: baseUrl.trim()
      });

      // 模擬 API 呼叫
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: selectedEndpointDetails, baseUrl: baseUrl.trim(), piiMasking: !!piiMasking })
      });

      if (!response.ok) throw new Error(`部署失敗：${response.statusText}`);
      const data = await response.json();
      setDeploymentInfo({ serverUrl: data.sseUrl, apiKey: 'test-key', piiMasking: !!piiMasking });
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
          <div className="mb-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded-lg p-4 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            {deployError}
          </div>
        )}
        {!deploymentInfo ? <DeploymentPanel onDeploy={handleDeploy} isDeploying={isDeploying} baseUrl={baseUrl} setBaseUrl={setBaseUrl} /> : <DeploymentSuccess />}
      </div>
    </div>
  );
}

// --- Provider & Entry Point ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMasking] = useState(false);
  const [targetBaseUrl, setTargetBaseUrl] = useState('');
  const [syncing, setSyncing] = useState(true);

  // 遵守規則 3: 先驗證，後查詢
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth init error", e); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 遵守規則 1: 實時同步雲端數據
  useEffect(() => {
    if (!user) return;
    setSyncing(true);
    const projectRef = doc(db, 'artifacts', appId, 'public', 'data', 'projects', 'current-project');
    
    return onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTargetBaseUrl(data.baseUrl || '');
        setPiiMasking(data.piiRedaction || false);
        
        // 同步選取的端點
        const selection = new Set<string>();
        if (data.selectedEndpoints) {
          Object.entries(data.selectedEndpoints).forEach(([key, isSelected]) => {
            if (isSelected) selection.add(key);
          });
        }
        setSelectedEndpoints(selection);
        
        // 如果有完整的 endpoints 列表也一併同步
        if (data.endpoints) setEndpoints(data.endpoints);
      }
      setSyncing(false);
    }, (err) => {
      console.error("Sync error", err);
      setSyncing(false);
    });
  }, [user]);

  const contextValue: AppContextType = {
    endpoints,
    selectedEndpoints,
    setSelectedEndpoints,
    deploymentInfo,
    setDeploymentInfo,
    piiMasking,
    setPiiMasking,
    isPro: true,
    targetBaseUrl,
    setTargetBaseUrl,
    syncing,
    user
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Deploy />
    </AppContext.Provider>
  );
}