import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
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

// --- Global Declarations ---
declare global {
  const __firebase_config: string | undefined;
  const __app_id: string | undefined;
  const __initial_auth_token: string | undefined;
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
  targetBaseUrl: string;
  setTargetBaseUrl: (url: string) => void;
  isInitialLoad: boolean;
}

// 🚀 YOUR FIREBASE CONFIGURATION (Verified)
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
  
  // Use a ref to track if we are currently loading from cloud to prevent feedback loops
  const isHydrating = useRef(true);

  // App State
  const [endpoints, setEndpointsState] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [macros, setMacrosState] = useState<MacroTool[]>([]);
  const [credentials, setCredentialsState] = useState<ApiCredential[]>([]);
  const [logs, setLogsState] = useState<LogEntry[]>([]);
  const [deploymentInfo, setDeploymentInfoState] = useState<any | null>(null);
  const [piiMasking, setPiiMaskingState] = useState(false);
  const [targetBaseUrl, setTargetBaseUrlState] = useState('');

  const [db, setDb] = useState<any>(null);
  const [appId, setAppId] = useState('mcp-studio-v1');

  // 1. Initialize Firebase & Auth
  useEffect(() => {
    try {
      const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : localFirebaseConfig;
      const firebaseApp = initializeApp(config);
      const firebaseAuth = getAuth(firebaseApp);
      const firestore = getFirestore(firebaseApp);
      
      setDb(firestore);
      if (typeof __app_id !== 'undefined') setAppId(__app_id);

      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (authErr) {
          console.error("❌ Auth Error:", authErr);
        }
      };
      
      initAuth();
      return onAuthStateChanged(firebaseAuth, (u) => setUser(u));
    } catch (e) {
      console.error("❌ Firebase Setup Error:", e);
      setIsInitialLoad(false);
    }
  }, []);

  // 2. Real-time Persistence (Read from Cloud)
  useEffect(() => {
    if (!user || !db) return;

    const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    
    const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
      isHydrating.current = true; 
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.selectedEndpoints) setSelectedEndpointsState(new Set(data.selectedEndpoints));
        if (data.macros) setMacrosState(data.macros);
        if (data.credentials) setCredentialsState(data.credentials);
        if (data.deploymentInfo) setDeploymentInfoState(data.deploymentInfo);
        if (data.piiMasking !== undefined) setPiiMaskingState(data.piiMasking);
        if (data.targetBaseUrl) setTargetBaseUrlState(data.targetBaseUrl);
        
        // 🛡️ FIX: Safe Timestamp Parsing
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

  // 3. Sync to Cloud (Write to Cloud)
  const syncToCloud = async (newState: any) => {
    if (!user || !db || isHydrating.current) return;
    
    try {
      // 🛡️ FIX: Remove JSON.stringify to keep native Date objects
      const cleanData = { ...newState };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) cleanData[key] = null;
      });

      const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      await setDoc(projectDocRef, cleanData, { merge: true });
    } catch (error) {
      console.error("❌ Cloud Save Failed:", error);
    }
  };

  // 4. Enhanced Logging logic (Sub-collection)
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
    } catch (e) {
      console.error("❌ Failed to save enhanced log:", e);
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
    setLogs: (valOrFn: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => { 
      const next = typeof valOrFn === 'function' ? valOrFn(logs) : valOrFn;
      setLogsState(next); syncToCloud({ logs: next }); 
    },
    deploymentInfo,
    setDeploymentInfo: (val: any) => { setDeploymentInfoState(val); syncToCloud({ deploymentInfo: val || null }); },
    piiMasking,
    setPiiMasking: (val: boolean) => { setPiiMaskingState(val); syncToCloud({ piiMasking: val }); },
    targetBaseUrl,
    setTargetBaseUrl: (val: string) => { setTargetBaseUrlState(val); syncToCloud({ targetBaseUrl: val }); },
    isInitialLoad
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