import React, { useState } from 'react';
import { useNavigate } from 'react-router';
/**
 * 1. IMPORTS
 * Using esm.sh to resolve the swagger-parser in this environment.
 */
// @ts-ignore
import SwaggerParser from 'https://esm.sh/@apidevtools/swagger-parser';
import { 
  Upload as UploadIcon, 
  FileJson, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react';

// @ts-ignore
import { useApp } from '../context/AppContext';

export default function Upload() {
  const navigate = useNavigate();
  /**
   * 2. CONTEXT EXTRACTION
   * resetWorkspace is used to clear stale deployment data when a new file is uploaded.
   */
  const { setEndpoints, setTargetBaseUrl, resetWorkspace, setDetectedAuthSchemes } = useApp() as any;
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  /**
   * 3. FILE SELECTION & RESET LOGIC
   * This logic ensures that previous session state (keys/URLs) is purged.
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setFileInfo({ 
      name: file.name, 
      size: (file.size / 1024).toFixed(1) + ' KB' 
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let apiJson;

        try {
          apiJson = JSON.parse(content);
        } catch {
          throw new Error("Invalid JSON file. Please provide a valid OpenAPI/Swagger JSON.");
        }

        // Parse using the external library
        // @ts-ignore
        const api = await SwaggerParser.parse(apiJson) as any;
        
        // Suggested Base URL extraction logic
        const suggestedUrl = api.servers?.[0]?.url || api.host || '';

        // Map paths to Endpoint interface
        const mappedEndpoints: any[] = [];
        if (api.paths) {
          Object.entries(api.paths).forEach(([path, methods]: [string, any]) => {
            Object.entries(methods).forEach(([method, details]: [string, any]) => {
              if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                mappedEndpoints.push({
                  id: `${method.toUpperCase()}:${path}`,
                  method: method.toUpperCase(),
                  path: path,
                  description: details.summary || details.description || '',
                  category: details.tags?.[0] || 'Uncategorized'
                });
              }
            });
          });
        }

        if (mappedEndpoints.length === 0) {
          throw new Error("No valid GET/POST/PUT/DELETE endpoints found in this file.");
        }

        // Parse security schemes from the spec
        const rawSchemes: Record<string, any> = api.components?.securitySchemes || (api as any).securityDefinitions || {};
        const detectedSchemes = Object.entries(rawSchemes).map(([name, scheme]: [string, any]) => {
          let authType: 'bearer' | 'apiKey-header' | 'apiKey-query' | 'basic' | 'oauth2' | 'other' = 'other';
          let paramName = '';
          if (scheme.type === 'http') {
            const s = (scheme.scheme || '').toLowerCase();
            if (s === 'bearer') { authType = 'bearer'; paramName = 'Authorization'; }
            else if (s === 'basic') { authType = 'basic'; paramName = 'Authorization'; }
          } else if (scheme.type === 'apiKey') {
            if (scheme.in === 'header') { authType = 'apiKey-header'; paramName = scheme.name || 'X-API-Key'; }
            else if (scheme.in === 'query') { authType = 'apiKey-query'; paramName = scheme.name || 'api_key'; }
          } else if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
            authType = 'oauth2'; paramName = 'Authorization';
          }

          let tokenUrl = '';
          let scopes = '';
          if (scheme.type === 'oauth2') {
            const flows = scheme.flows || {};
            const flow = flows.clientCredentials || flows.authorizationCode || flows.password || flows.implicit || {};
            tokenUrl = flow.tokenUrl || scheme.tokenUrl || '';
            scopes = Object.keys(flow.scopes || scheme.scopes || {}).join(' ');
          }

          return { name, authType, paramName, ...(tokenUrl && { tokenUrl }), ...(scopes && { scopes }) };
        });

        if (typeof resetWorkspace === 'function') {
          await resetWorkspace();
        }

        setDetectedAuthSchemes(detectedSchemes);
        setEndpoints(mappedEndpoints);
        if (suggestedUrl) {
          setTargetBaseUrl(suggestedUrl);
        }
        
        setTimeout(() => {
          navigate('/prune');
        }, 800);

      } catch (err: any) {
        setError(err.message || "Failed to parse the API file.");
        setFileInfo(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#141B41] dark:text-white mb-4 tracking-tight">
          Create Your MCP Server
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Upload an OpenAPI or Swagger JSON to start building your agentic tools.
        </p>
      </div>

      <div className="relative group">
        <div className={`
          border-3 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[350px]
          ${error ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10' : 
            fileInfo ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10' : 
            'border-slate-200 bg-white hover:border-blue-400 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-blue-500 shadow-sm hover:shadow-md'}
        `}>
          {!isParsing && !fileInfo && (
            <>
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UploadIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-semibold text-[#141B41] dark:text-white mb-2">Click to upload JSON</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Supports OpenAPI 3.0 and Swagger 2.0</p>
              
              <label className="cursor-pointer">
                <span className="px-8 py-3 bg-[#141B41] dark:bg-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg">
                  Browse Files
                </span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileSelect} />
              </label>
            </>
          )}

          {isParsing && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-lg font-medium text-[#141B41] dark:text-white">Parsing API Definition...</p>
            </div>
          )}

          {fileInfo && !isParsing && (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
                <FileJson className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-bold text-[#141B41] dark:text-white mb-1">{fileInfo.name}</p>
              <p className="text-slate-500 text-sm mb-6">{fileInfo.size}</p>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 size={18} />
                <span>Successfully Validated</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50">
        <h3 className="text-[#141B41] dark:text-white font-semibold flex items-center gap-2 mb-2">
          <Info size={18} className="text-blue-600" />
          Pro Tip: Security First
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          MCP Studio handles the complex authentication and endpoint pruning for you. For production APIs, we recommend selecting only the endpoints your AI agent actually needs to prevent "context bloat" and ensure security.
        </p>
      </div>
    </div>
  );
}