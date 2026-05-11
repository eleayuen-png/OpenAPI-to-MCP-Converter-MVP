import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  setDoc 
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
  setLogs: (logs: LogEntry[]) => void;
  deploymentInfo: { serverUrl: string; apiKey: string } | null;
  setDeploymentInfo: (info: { serverUrl: string; apiKey: string } | null) => void;
  isInitialLoad: boolean;
}

// 🚀 YOUR FIREBASE CONFIGURATION
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

  // App State
  const [endpoints, setEndpointsState] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [macros, setMacrosState] = useState<MacroTool[]>([]);
  const [credentials, setCredentialsState] = useState<ApiCredential[]>([]);
  const [logs, setLogsState] = useState<LogEntry[]>([]);
  const [deploymentInfo, setDeploymentInfoState] = useState<{ serverUrl: string; apiKey: string } | null>(null);

  // --- Initialize Firebase Safely ---
  const [db, setDb] = useState<any>(null);
  const [appId, setAppId] = useState('mcp-studio-v1');

  useEffect(() => {
    try {
      // Priority: 1. Environment Config (Workspace) 2. Local Config (Your Live Site)
      const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : localFirebaseConfig;

      const firebaseApp = initializeApp(config);
      const firebaseAuth = getAuth(firebaseApp);
      const firestore = getFirestore(firebaseApp);
      
      setDb(firestore);
      
      if (typeof __app_id !== 'undefined') {
        setAppId(__app_id);
      }

      // Auth Flow
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      };
      initAuth();

      return onAuthStateChanged(firebaseAuth, (u) => setUser(u));
    } catch (e) {
      console.error("Firebase Init Error:", e);
      setIsInitialLoad(false);
    }
  }, []);

  // --- Persistence Effect (Real-time Sync) ---
  useEffect(() => {
    if (!user || !db) return;

    const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    
    const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.selectedEndpoints) setSelectedEndpointsState(new Set(data.selectedEndpoints));
        if (data.macros) setMacrosState(data.macros);
        if (data.credentials) setCredentialsState(data.credentials);
        if (data.deploymentInfo) setDeploymentInfoState(data.deploymentInfo);
        
        if (data.logs) {
          setLogsState(data.logs.map((l: any) => ({
            ...l,
            timestamp: l.timestamp?.toDate() || new Date(l.timestamp)
          })));
        }
      }
      setIsInitialLoad(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, [user, db, appId]);

  // --- Helper for updating cloud state ---
  const syncToCloud = async (newState: any) => {
    if (!user || !db) return;
    try {
      const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      await setDoc(projectDocRef, newState, { merge: true });
    } catch (error) {
      console.error("Error syncing to cloud:", error);
    }
  };

  // --- Wrapped Setters ---
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
    setLogs: (valOrFn: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => { 
      const next = typeof valOrFn === 'function' ? valOrFn(logs) : valOrFn;
      setLogsState(next); syncToCloud({ logs: next }); 
    },
    deploymentInfo,
    setDeploymentInfo: (val: any) => { setDeploymentInfoState(val); syncToCloud({ deploymentInfo: val }); },
    isInitialLoad
  };

  return (
    <AppContext.Provider value={value}>
      {!isInitialLoad && children}
      {isInitialLoad && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Restoring your workspace...</p>
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