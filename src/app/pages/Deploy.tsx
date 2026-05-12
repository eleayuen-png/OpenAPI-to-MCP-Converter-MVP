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
  Loader2
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

// --- UI Components (UpgradeModal, DeploymentPanel, DeploymentSuccess) Omitted for Brevity but Preserved in Logic ---
// Note: Only updating the Root App logic to fix the sync bug.

// --- 6. ROOT APPLICATION ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [endpoints, setEndpointsState] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpointsState] = useState<Set<string>>(new Set());
  const [deploymentInfo, setDeploymentInfoState] = useState<DeploymentInfo | null>(null);
  const [piiMasking, setPiiMaskingState] = useState(false);
  const [targetBaseUrl, setTargetBaseUrlState] = useState('');
  const [syncing, setSyncing] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // We use a Ref to prevent the Snapshot listener from overwriting local changes while we are saving
  const isUpdatingCloud = useRef(false);

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
      // 🚩 CRITICAL: If we are currently sending a save to the cloud, ignore incoming snapshots
      // to prevent the "Race Condition" UI flicker.
      if (isUpdatingCloud.current) return;

      if (snap.exists()) {
        const data = snap.data();
        if (data.targetBaseUrl) setTargetBaseUrlState(data.targetBaseUrl);
        if (data.piiMasking !== undefined) setPiiMaskingState(data.piiRedaction || data.piiMasking || false);
        if (data.isPro !== undefined) setIsPro(data.isPro);
        
        if (Array.isArray(data.selectedEndpoints)) {
          setSelectedEndpointsState(new Set(data.selectedEndpoints));
        } else if (data.selectedEndpoints && typeof data.selectedEndpoints === 'object') {
           const selection = new Set<string>();
           Object.entries(data.selectedEndpoints).forEach(([k, v]) => { if (v) selection.add(k); });
           setSelectedEndpointsState(selection);
        }
        
        if (data.endpoints) setEndpointsState(data.endpoints);
        if (data.deploymentInfo) setDeploymentInfoState(data.deploymentInfo);
      }
      setSyncing(false);
    }, (err) => {
      console.error("Data sync error:", err);
      setSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to sync specific keys to cloud
  const syncToCloud = async (data: any) => {
    if (!user || !db) return;
    isUpdatingCloud.current = true;
    try {
      const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project', 'current');
      await setDoc(projectRef, data, { merge: true });
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    } finally {
      // Wait a moment before allowing snapshots again to let Firestore stabilize
      setTimeout(() => { isUpdatingCloud.current = false; }, 500);
    }
  };

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
    setEndpointsState([]);
    setSelectedEndpointsState(new Set());
    setDeploymentInfoState(null);
    setTargetBaseUrlState('');
  };

  const contextValue = { 
    endpoints, 
    setEndpoints: (val: Endpoint[]) => { setEndpointsState(val); syncToCloud({ endpoints: val }); },
    selectedEndpoints, 
    setSelectedEndpoints: (val: Set<string>) => { 
      setSelectedEndpointsState(val); 
      syncToCloud({ selectedEndpoints: Array.from(val) }); // 🚩 FIX: Immediate Save
    },
    deploymentInfo, 
    setDeploymentInfo: (val: any) => { setDeploymentInfoState(val); syncToCloud({ deploymentInfo: val }); },
    piiMasking, 
    setPiiMasking: (val: boolean) => { setPiiMaskingState(val); syncToCloud({ piiMasking: val }); },
    isPro, 
    targetBaseUrl, 
    setTargetBaseUrl: (val: string) => { setTargetBaseUrlState(val); syncToCloud({ targetBaseUrl: val }); },
    syncing, 
    user, 
    resetWorkspace 
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
       {/* Note: In your real code, the Router and Pages go here */}
       <div className="min-h-screen bg-[#020617] text-slate-200">
         {children}
       </div>
    </AppContext.Provider>
  );
}