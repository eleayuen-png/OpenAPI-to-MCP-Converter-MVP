import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { 
  Upload as UploadIcon, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ChevronRight, 
  ChevronLeft, 
  Filter, 
  Search, 
  Check, 
  Lightbulb,
  Zap,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';

// @ts-ignore
import SwaggerParser from 'https://esm.sh/@apidevtools/swagger-parser';
// @ts-ignore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
// @ts-ignore
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
// @ts-ignore
import { getFirestore, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// --- Types ---
export interface Endpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  category: string;
}

interface AppContextType {
  user: any;
  endpoints: Endpoint[];
  setEndpoints: (val: Endpoint[]) => void;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (val: Set<string>) => void;
  targetBaseUrl: string;
  setTargetBaseUrl: (val: string) => void;
  resetWorkspace: () => Promise<void>;
}

const localFirebaseConfig = {
  apiKey: "AIzaSyB0Px3NSulFTBj8GeLrET1itIpJJovnN48",
  authDomain: "mcp-studio-22971.firebaseapp.com",
  projectId: "mcp-studio-22971",
  storageBucket: "mcp-studio-22971.firebasestorage.app",
  messagingSenderId: "1096681882291",
  appId: "1:1096681882291:web:9452e01ee86294b33ee6c6"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isHydrating = useRef(true);

  const [endpoints, setEndpointsState] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [targetBaseUrl, setTargetBaseUrlState] = useState('');

  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    const config = localFirebaseConfig;
    const firebaseApp = initializeApp(config);
    const auth = getAuth(firebaseApp);
    setDb(getFirestore(firebaseApp));

    onAuthStateChanged(auth, (u: any) => {
      if (!u) signInAnonymously(auth);
      else setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const projectDocRef = doc(db, 'artifacts', 'mcp-studio-v1', 'users', user.uid, 'project', 'current');
    const unsubscribe = onSnapshot(projectDocRef, (docSnap: any) => {
      isHydrating.current = true; 
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.targetBaseUrl) setTargetBaseUrlState(data.targetBaseUrl);
        if (Array.isArray(data.selectedEndpoints)) {
          setSelectedEndpointsState(new Set(data.selectedEndpoints));
        }
      }
      setIsInitialLoad(false);
      setTimeout(() => { isHydrating.current = false; }, 100);
    });
    return () => unsubscribe();
  }, [user, db]);

  const syncToCloud = async (newState: any) => {
    if (!user || !db || isHydrating.current) return;
    const projectDocRef = doc(db, 'artifacts', 'mcp-studio-v1', 'users', user.uid, 'project', 'current');
    await setDoc(projectDocRef, newState, { merge: true });
  };

  const value = {
    user,
    endpoints,
    setEndpoints: (val: Endpoint[]) => { setEndpointsState(val); syncToCloud({ endpoints: val }); },
    selectedEndpoints,
    setSelectedEndpoints: (val: Set<string>) => { setSelectedEndpointsState(val); syncToCloud({ selectedEndpoints: Array.from(val) }); },
    targetBaseUrl,
    setTargetBaseUrl: (val: string) => { setTargetBaseUrlState(val); syncToCloud({ targetBaseUrl: val }); },
    resetWorkspace: async () => {
       setEndpointsState([]);
       setSelectedEndpointsState(new Set());
       setTargetBaseUrlState('');
       if (user && db) {
         await setDoc(doc(db, 'artifacts', 'mcp-studio-v1', 'users', user.uid, 'project', 'current'), {
           endpoints: [],
           selectedEndpoints: [],
           targetBaseUrl: ''
         }, { merge: true });
       }
    }
  };

  return <AppContext.Provider value={value}>{!isInitialLoad && children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext)!;

function UploadPage({ onNext }: { onNext: () => void }) {
  const { setEndpoints, setTargetBaseUrl, resetWorkspace } = useApp();
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const apiJson = JSON.parse(content);
        // @ts-ignore
        const api = await SwaggerParser.parse(apiJson);
        const suggestedUrl = api.servers?.[0]?.url || api.host || '';
        const mapped: Endpoint[] = [];
        Object.entries(api.paths || {}).forEach(([path, methods]: [string, any]) => {
          Object.entries(methods).forEach(([method, details]: [string, any]) => {
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
              mapped.push({
                id: `${method.toUpperCase()}:${path}`,
                method: method.toUpperCase(),
                path,
                description: details.summary || details.description || '',
                category: details.tags?.[0] || 'Uncategorized'
              });
            }
          });
        });
        await resetWorkspace();
        setEndpoints(mapped);
        if (suggestedUrl) setTargetBaseUrl(suggestedUrl);
        onNext();
      } catch (err: any) { setError(err.message); } finally { setIsParsing(false); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 text-center">
      <h1 className="text-4xl font-bold text-[#141B41] dark:text-white mb-4">Create Your MCP Server</h1>
      <p className="text-slate-500 mb-12">Drop your Swagger/OpenAPI file below to begin.</p>
      <div className="border-3 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 bg-white dark:bg-[#111827]">
        {isParsing ? <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" /> : (
          <label className="cursor-pointer px-8 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-medium">
            Browse JSON Files
            <input type="file" className="hidden" accept=".json" onChange={handleFileSelect} />
          </label>
        )}
        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}

function PrunePage({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { endpoints, selectedEndpoints, setSelectedEndpoints } = useApp();
  const [search, setSearch] = useState('');
  const [isMagic, setIsMagic] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const filtered = endpoints.filter(ep => 
    ep.path.toLowerCase().includes(search.toLowerCase()) || 
    ep.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleMagicSuggest = async () => {
    setIsMagic(true);
    setMagicError(null);
    setSecondsElapsed(0);
    
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    try {
      // In the Canvas UI, we bypass your external Render backend and call the preview AI directly 
      // so you can instantly verify functionality without waiting for cloud deployments.
      const apiKey = "";
      const payload = endpoints.map((ep: any) => ({
        id: ep.id || `${ep.method}:${ep.path}`,
        description: ep.description || ''
      }));
      
      const schemaSummary = payload.map((e: any) => `- ID: "${e.id}" | Description: ${e.description}`).join('\n');
      const userPrompt = `Return a JSON object with a "suggestions" array containing the best tool IDs from this list:\n\n${schemaSummary}`;
      const systemPrompt = "You are an AI Tool Architect. Suggest the 3-5 most useful endpoints from the provided list for an AI agent. Return valid JSON only.";
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Server Error");
      
      const aiRaw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiRaw) {
         const parsed = JSON.parse(aiRaw);
         if (parsed.suggestions) setSelectedEndpoints(new Set(parsed.suggestions));
      }
    } catch (e: any) { 
      setMagicError(e.message); 
    } finally { 
      setIsMagic(false); 
      clearInterval(timer);
    }
  };

  const selectAllGlobal = () => {
    const allIds = new Set(endpoints.map(ep => ep.id));
    setSelectedEndpoints(allIds);
  };

  const deselectAllGlobal = () => {
    setSelectedEndpoints(new Set());
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {magicError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-2 items-center">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium"><b>Magic Suggest Failed:</b> {magicError}</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:bg-[#111827] dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Search endpoints..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={selectAllGlobal}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Select All
          </button>
          <button 
            onClick={deselectAllGlobal}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Deselect All
          </button>
          <button 
            onClick={handleMagicSuggest} 
            disabled={isMagic} 
            className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all ${isMagic ? 'opacity-90 cursor-not-allowed' : 'active:scale-95'}`}
          >
            {isMagic ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing ({secondsElapsed}s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Magic Suggest
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {filtered.map(ep => {
           const checked = selectedEndpoints.has(ep.id);
           return (
             <div key={ep.id} onClick={() => {
                const next = new Set(selectedEndpoints);
                if (checked) next.delete(ep.id); else next.add(ep.id);
                setSelectedEndpoints(next);
             }} className={`p-4 bg-white dark:bg-[#111827] border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${checked ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                 {checked && <Check className="w-3.5 h-3.5" />}
               </div>
               <span className={`font-bold text-xs px-2 py-1 rounded ${
                 ep.method === 'GET' ? 'bg-green-100 text-green-700' : 
                 ep.method === 'POST' ? 'bg-blue-100 text-blue-700' : 
                 'bg-amber-100 text-orange-700'
               }`}>{ep.method}</span>
               <span className="font-mono text-sm flex-1 truncate dark:text-blue-100">{ep.path}</span>
               <span className="text-xs text-slate-500 hidden sm:block italic">{ep.category}</span>
             </div>
           );
        })}
      </div>
      <div className="mt-12 flex justify-between">
        <button onClick={onBack} className="text-slate-500 font-medium hover:text-slate-800 transition-colors">Back</button>
        <button onClick={onNext} className="px-10 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-all">Continue to Deploy</button>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
        <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md flex items-center px-8 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl tracking-tight">MCP Studio</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>{s}</div>
              ))}
            </div>
          </div>
        </nav>
        <main className="p-8">
          {step === 1 && <UploadPage onNext={() => setStep(2)} />}
          {step === 2 && <PrunePage onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step >= 3 && (
            <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
              <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-2xl font-bold mb-2">Workspace Ready</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Your API configuration is locked and synced. Continue to the next phase to add authentication keys.</p>
              <button onClick={() => setStep(1)} className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 transition-colors">Reset Wizard</button>
            </div>
          )}
        </main>
      </div>
    </AppProvider>
  );
}