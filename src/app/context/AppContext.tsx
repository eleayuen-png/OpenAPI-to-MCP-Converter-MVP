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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  linkWithCredential,
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
  const __firebase_config: string | undefined;
  const __app_id: string | undefined;
  const __initial_auth_token: string | undefined;
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
  endpoints: any[];
  setEndpoints: (val: any[]) => void;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (val: Set<string>) => void;
  macros: any[];
  setMacros: (val: any[]) => void;
  credentials: any[];
  setCredentials: (val: any[]) => void;
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => Promise<void>;
  deploymentInfo: any;
  setDeploymentInfo: (val: any) => void;
  piiMasking: boolean;
  setPiiMasking: (val: boolean) => void;
  targetBaseUrl: string;
  setTargetBaseUrl: (val: string) => void;
  isInitialLoad: boolean;
  // New Auth Functions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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

  const [endpoints, setEndpointsState] = useState<any[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [macros, setMacrosState] = useState<any[]>([]);
  const [credentials, setCredentialsState] = useState<any[]>([]);
  const [logs, setLogsState] = useState<LogEntry[]>([]);
  const [deploymentInfo, setDeploymentInfoState] = useState<any | null>(null);
  const [piiMasking, setPiiMaskingState] = useState(false);
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
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else if (!firebaseAuth.currentUser) {
          await signInAnonymously(firebaseAuth);
        }
      };
      
      initAuth();
      return onAuthStateChanged(firebaseAuth, (u) => {
        setUser(u);
      });
    } catch (e) {
      console.error(e);
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
        if (data.selectedEndpoints) setSelectedEndpointsState(new Set(data.selectedEndpoints));
        if (data.macros) setMacrosState(data.macros);
        if (data.credentials) setCredentialsState(data.credentials);
        if (data.deploymentInfo) setDeploymentInfoState(data.deploymentInfo);
        if (data.piiMasking !== undefined) setPiiMaskingState(data.piiMasking);
        if (data.targetBaseUrl) setTargetBaseUrlState(data.targetBaseUrl);
        if (data.logs) {
          setLogsState(data.logs.map((l: any) => ({
            ...l,
            timestamp: l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp)
          })));
        }
      }
      setIsInitialLoad(false);
      setTimeout(() => { isHydrating.current = false; }, 100);
    }, () => setIsInitialLoad(false));
    return () => unsubscribe();
  }, [user, db, appId]);

  const syncToCloud = async (newState: any) => {
    if (!user || !db || isHydrating.current) return;
    try {
      const cleanData = { ...newState };
      Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) cleanData[key] = null; });
      const projectDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      await setDoc(projectDocRef, cleanData, { merge: true });
    } catch (e) { console.error(e); }
  };

  const addLog = async (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (!user || !db) return;
    const logData = { ...log, timestamp: new Date(), id: Math.random().toString(36).substr(2, 9) };
    setLogsState(prev => [logData, ...prev].slice(0, 50));
    try {
      const logsColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
      await addDoc(logsColRef, logData);
      syncToCloud({ logs: [logData, ...logs].slice(0, 10) });
    } catch (e) { console.error(e); }
  };

  const loginWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      // If anonymous, link the account so they don't lose their project
      if (user?.isAnonymous) {
        await linkWithCredential(user, GoogleAuthProvider.credentialFromResult(await signInWithPopup(auth, provider))!);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      console.error("Auth Error:", e);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.reload(); // Refresh to clear state and re-init anonymous session
  };

  const value: AppContextType = {
    user,
    endpoints,
    setEndpoints: (val: any[]) => { setEndpointsState(val); syncToCloud({ endpoints: val }); },
    selectedEndpoints,
    setSelectedEndpoints: (val: Set<string>) => { setSelectedEndpointsState(val); syncToCloud({ selectedEndpoints: Array.from(val) }); },
    macros,
    setMacros: (val: any[]) => { setMacrosState(val); syncToCloud({ macros: val }); },
    credentials,
    setCredentials: (val: any[]) => { setCredentialsState(val); syncToCloud({ credentials: val }); },
    logs,
    addLog,
    deploymentInfo,
    setDeploymentInfo: (val: any) => { setDeploymentInfoState(val); syncToCloud({ deploymentInfo: val }); },
    piiMasking,
    setPiiMasking: (val: boolean) => { setPiiMaskingState(val); syncToCloud({ piiMasking: val }); },
    targetBaseUrl,
    setTargetBaseUrl: (val: string) => { setTargetBaseUrlState(val); syncToCloud({ targetBaseUrl: val }); },
    isInitialLoad,
    loginWithGoogle,
    logout
  };

  return (
    <AppContext.Provider value={value}>
      {!isInitialLoad ? children : <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div></div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}