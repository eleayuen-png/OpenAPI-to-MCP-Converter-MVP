import { createContext, useContext, useState, ReactNode } from 'react';
import type { Endpoint } from '../components/EndpointList';

export interface MacroTool {
  id: string;
  name: string;
  description: string;
  endpoints: Array<{
    endpointKey: string;
    order: number;
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
  endpoints: Endpoint[];
  setEndpoints: (endpoints: Endpoint[]) => void;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (endpoints: Set<string>) => void;
  macroTools: MacroTool[];
  setMacroTools: (tools: MacroTool[]) => void;
  credentials: ApiCredential[];
  setCredentials: (credentials: ApiCredential[]) => void;
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  deploymentInfo: { serverUrl: string; apiKey: string } | null;
  setDeploymentInfo: (info: { serverUrl: string; apiKey: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [macroTools, setMacroTools] = useState<MacroTool[]>([]);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deploymentInfo, setDeploymentInfo] = useState<{ serverUrl: string; apiKey: string } | null>(null);

  return (
    <AppContext.Provider
      value={{
        endpoints,
        setEndpoints,
        selectedEndpoints,
        setSelectedEndpoints,
        macroTools,
        setMacroTools,
        credentials,
        setCredentials,
        logs,
        setLogs,
        deploymentInfo,
        setDeploymentInfo,
      }}
    >
      {children}
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
