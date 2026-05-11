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
  setDoc, 
  collection 
} from 'firebase/firestore';

import type { Endpoint } from '../components/EndpointList';

// --- Global Declarations for Environment Variables ---
declare global {
  const __firebase_config: string;
  const __app_id: string | undefined;
  const __initial_auth_token: string | undefined;
}

// --- Interfaces ---

export interface MacroTool {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    method: string;
    path: string;
  }>;
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

// --- Firebase Initialization ---

// @ts-ignore - Variables provided by the environment
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore - appId provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mcp-studio-v1';

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

  // --- Auth Effect ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        // @ts-ignore - Token provided by the environment
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // --- Persistence Effect (Real-time Sync) ---
  useEffect(() => {
    if (!user) return;

    // RULE 1: Strict Paths
    // Using a single document "projectState" to keep it simple and ensure data consistency
    const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');

    const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.selectedEndpoints) setSelectedEndpointsState(new Set(data.selectedEndpoints));
        if (data.macros) setMacrosState(data.macros);
        if (data.credentials) setCredentialsState(data.credentials);
        if (data.deploymentInfo) setDeploymentInfoState(data.deploymentInfo);
        
        // Logs are stored separately usually, but for MVP we sync them here
        if (data.logs) {
          // Re-convert serializable timestamps back to Dates
          const hydratedLogs = data.logs.map((log: any) => ({
            ...log,
            timestamp: log.timestamp?.toDate() || new Date(log.timestamp)
          }));
          setLogsState(hydratedLogs);
        }
      }
      setIsInitialLoad(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Helper for updating cloud state ---
  const syncToCloud = async (newState: Partial<{
    endpoints: Endpoint[];
    selectedEndpoints: string[];
    macros: MacroTool[];
    credentials: ApiCredential[];
    logs: any[];
    deploymentInfo: any;
  }>) => {
    if (!user) return;
    const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
    
    try {
      await setDoc(projectDocRef, newState, { merge: true });
    } catch (error) {
      console.error("Error syncing to cloud:", error);
    }
  };

  // --- Wrapped Setters ---

  const setEndpoints = (val: Endpoint[]) => {
    setEndpointsState(val);
    syncToCloud({ endpoints: val });
  };

  const setSelectedEndpoints = (val: Set<string>) => {
    setSelectedEndpointsState(val);
    syncToCloud({ selectedEndpoints: Array.from(val) });
  };

  const setMacros = (val: MacroTool[]) => {
    setMacrosState(val);
    syncToCloud({ macros: val });
  };

  const setCredentials = (val: ApiCredential[]) => {
    setCredentialsState(val);
    syncToCloud({ credentials: val });
  };

  const setLogs = (valOrFn: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => {
    const newLogs = typeof valOrFn === 'function' ? valOrFn(logs) : valOrFn;
    setLogsState(newLogs);
    syncToCloud({ logs: newLogs });
  };

  const setDeploymentInfo = (val: { serverUrl: string; apiKey: string } | null) => {
    setDeploymentInfoState(val);
    syncToCloud({ deploymentInfo: val });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        endpoints,
        setEndpoints,
        selectedEndpoints,
        setSelectedEndpoints,
        macros,
        setMacros,
        credentials,
        setCredentials,
        logs,
        setLogs,
        deploymentInfo,
        setDeploymentInfo,
        isInitialLoad
      }}
    >
      {!isInitialLoad && children}
      {isInitialLoad && (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Syncing with cloud...</p>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}