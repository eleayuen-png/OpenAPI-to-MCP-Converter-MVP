import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  linkWithCredential,
  signInWithCredential,
  User
} from 'firebase/auth';
// @ts-ignore
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc,
  collection,
  addDoc
} from 'firebase/firestore';

import type { Endpoint } from '../components/EndpointList';

declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

export interface MacroTool {
  id: string;
  name: string;
  description: string;
  steps: Array<{ method: string; path: string; }>;
}

export interface ApiCredential {
  id: string;
  name: string;
  type: 'bearer' | 'api-key' | 'basic';
  key: string;
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  endpoint: string;
  statusCode: number;
  message: string;
  request?: any;
  response?: any;
}

interface AppContextType {
  user: User | null;
  endpoints: Endpoint[];
  setEndpoints: (endpoints: Endpoint[]) => void;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (endpoints: Set<string>) => void;
  macros: MacroTool[];
  setMacros: (tools: MacroTool[]) => void;
  credentials: ApiCredential[];
  setCredentials: (credentials: ApiCredential[]) => void;
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => Promise<void>;
  setLogs: (logs: LogEntry[]) => void;
  deploymentInfo: { serverUrl: string; apiKey: string; piiMasking?: boolean } | null;
  setDeploymentInfo: (info: any | null) => void;
  piiMasking: boolean;
  setPiiMasking: (enabled: boolean) => void;
  isPro: boolean;
  targetBaseUrl: string;
  setTargetBaseUrl: (url: string) => void;
  isInitialLoad: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetWorkspace: () => Promise<void>;
}

const localFirebaseConfig = {
  apiKey: "AIzaSyB0Px3NSulFTBj8GeLrET1itIpJJovnN48",
  authDomain: "mcp-studio-22971.firebaseapp.com",
  projectId: "mcp-studio-22971",
  storageBucket: "mcp-studio-22971.firebasestorage.app",
  messagingSenderId: "1096681882291",
  appId: "1:1096681882291:web:9452e01ee86294b33ee6c6",
  measurementId: "G-8HBCC81VHB"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const isHydrating = useRef(true);

  // App State
  const [endpoints, setEndpointsState] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [macros, setMacrosState] = useState<MacroTool[]>([]);
  const [credentials, setCredentialsState] = useState<ApiCredential[]>([]);
  const [logs, setLogsState] = useState<LogEntry[]>([]);
  const [deploymentInfo, setDeploymentInfoState] = useState<any | null>(null);
  const [piiMasking, setPiiMaskingState] = useState(false); // 🚩 DEFAULT: FALSE
  const [isPro, setIsProState] = useState(false);
  const [targetBaseUrl, setTargetBaseUrlState] = useState('');

  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [appId, setAppId] = useState('mcp-studio-v1');

  useEffect(() => {
    try {
      const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : localFirebaseConfig;
      const firebaseApp = initializeApp(config);
      const firebaseAuth = getAuth(firebaseApp);
      const firestore = getFirestore(firebaseApp);
      
      setDb(firestore);
      setAuth(firebaseAuth);
      if (typeof __app_id !== 'undefined') setAppId(__app_id);

      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
          } else if (!firebaseAuth.currentUser) {
            await signInAnonymously(firebaseAuth);
          }
        } catch (authErr) {
          console.error("❌ Auth Error:", authErr);
        }
      };
      
      initAuth();
      return onAuthStateChanged(firebaseAuth, (u) => {
        setUser(u);
      });
    } catch (e) {
      console.error("❌ Firebase Setup Error:", e);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    
    const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
      isHydrating.current = true; 
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.macros) setMacrosState(data.macros);
        if (data.credentials) setCredentialsState(data.credentials);
        if (data.deploymentInfo !== undefined) setDeploymentInfoState(data.deploymentInfo);
        if (data.isPro !== undefined) setIsProState(data.isPro);
        if (data.targetBaseUrl !== undefined) setTargetBaseUrlState(data.targetBaseUrl);
        
        // 🚩 ENFORCEMENT: Force off if user is not Pro
        const proStatus = !!data.isPro;
        if (data.piiMasking !== undefined) {
           setPiiMaskingState(proStatus ? data.piiMasking : false);
        }
        
        // Robust hydration for Sets to prevent refresh wipe-outs
        if (data.selectedEndpoints) {
          if (Array.isArray(data.selectedEndpoints)) {
            setSelectedEndpointsState(new Set(data.selectedEndpoints));
          } else if (typeof data.selectedEndpoints === 'object') {
            const selection = new Set<string>();
            Object.entries(data.selectedEndpoints).forEach(([k, v]) => { if (v) selection.add(k); });
            setSelectedEndpointsState(selection);
          }
        }
        
        if (data.logs) {
          setLogsState(data.logs.map((l: any) => {
            let parsedDate = new Date();
            if (l.timestamp) {
              if (typeof l.timestamp.toDate === 'function') {
                parsedDate = l.timestamp.toDate();
              } else {
                parsedDate = new Date(l.timestamp);
              }
            }
            return { ...l, timestamp: parsedDate };
          }));
        }
      }
      
      setIsInitialLoad(false);
      setTimeout(() => { isHydrating.current = false; }, 100);
    }, (error) => {
      console.error("❌ Firestore Sync Error:", error);
      setIsInitialLoad(false);
      isHydrating.current = false;
    });

    return () => unsubscribe();
  }, [user, db, appId]);

  const syncToCloud = async (newState: any) => {
    if (!user || !db || isHydrating.current) return;
    
    try {
      const cleanData = { ...newState };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) cleanData[key] = null;
      });

      const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      await setDoc(projectDocRef, cleanData, { merge: true });
    } catch (error: any) {
      console.warn("⚠️ Cloud Save Failed:", error.message);
    }
  };

  const resetWorkspace = async () => {
    setEndpointsState([]);
    setSelectedEndpointsState(new Set());
    setMacrosState([]);
    setDeploymentInfoState(null);
    setTargetBaseUrlState('');
    setPiiMaskingState(false); // 🚩 RESET LOCALLY

    if (user && db) {
      try {
        const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
        await setDoc(projectDocRef, {
          endpoints: [],
          selectedEndpoints: [],
          macros: [],
          deploymentInfo: null,
          targetBaseUrl: '',
          piiMasking: false // 🚩 RESET CLOUD
        }, { merge: true });
      } catch (e: any) {
        console.warn("⚠️ Reset sync failed:", e.message);
      }
    }
  };

  const addLog = async (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (!user || !db) return;
    
    const logData = { 
      ...log, 
      timestamp: new Date(), 
      id: Math.random().toString(36).substr(2, 9) 
    };
    
    setLogsState(prev => [logData, ...prev].slice(0, 50));

    try {
      const logsColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
      await addDoc(logsColRef, logData);
      syncToCloud({ logs: [logData, ...logs].slice(0, 10) });
    } catch (e: any) {
      console.warn("⚠️ Log failed:", e.message);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential) throw new Error("Could not retrieve Google credential.");
      if (user?.isAnonymous) {
        try {
          await linkWithCredential(user, credential);
        } catch (linkError: any) {
          if (linkError.code === 'auth/credential-already-in-use') {
            await signInWithCredential(auth, credential);
          } else {
            throw linkError;
          }
        }
      }
    } catch (e: any) {
      console.error("Auth Error:", e);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.reload();
    } catch (e) {
      console.error("Logout Error:", e);
    }
  };

  const value = {
    user,
    endpoints,
    setEndpoints: (val: Endpoint[]) => { setEndpointsState(val); syncToCloud({ endpoints: val }); },
    selectedEndpoints,
    setSelectedEndpoints: (val: Set<string>) => { setSelectedEndpointsState(val); syncToCloud({ selectedEndpoints: Array.from(val) }); },
    macros,
    setMacros: (val: MacroTool[]) => { setMacrosState(val); syncToCloud({ macros: val }); },
    credentials,
    setCredentials: (val: ApiCredential[]) => { setCredentialsState(val); syncToCloud({ credentials: val }); },
    logs,
    addLog,
    setLogs: (val: any) => setLogsState(val),
    deploymentInfo,
    setDeploymentInfo: (val: any) => { setDeploymentInfoState(val); syncToCloud({ deploymentInfo: val || null }); },
    piiMasking,
    setPiiMasking: (val: boolean) => { 
      const finalVal = isPro ? val : false;
      setPiiMaskingState(finalVal); 
      syncToCloud({ piiMasking: finalVal }); 
    },
    isPro,
    targetBaseUrl,
    setTargetBaseUrl: (val: string) => { setTargetBaseUrlState(val); syncToCloud({ targetBaseUrl: val }); },
    isInitialLoad,
    loginWithGoogle,
    logout,
    resetWorkspace
  };

  return (
    <AppContext.Provider value={value}>
      {!isInitialLoad && children}
      {isInitialLoad && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-slate-900 dark:text-white font-semibold">Restoring your workspace</p>
              <p className="text-slate-500 text-sm">Synchronizing with MCP Studio Cloud...</p>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}