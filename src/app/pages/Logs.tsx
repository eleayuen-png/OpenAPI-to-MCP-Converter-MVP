import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { AlertCircle, AlertTriangle, Info, RefreshCw, ArrowLeft, Filter } from 'lucide-react';
import { useState } from 'react';

export default function Logs() {
  const navigate = useNavigate();
  const { logs, setLogs } = useApp();
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filteredLogs = logs.filter(log =>
    filterLevel === 'all' ? true : log.level === filterLevel
  );

  const addMockLog = () => {
    const mockLogs = [
      {
        id: Math.random().toString(),
        timestamp: new Date(),
        level: 'error' as const,
        endpoint: 'GET /customers',
        statusCode: 400,
        message: 'Field "customer_id" not found. API schema may have changed to "client_id".',
        request: { customer_id: '12345' },
        response: { error: 'Invalid field name' },
      },
      {
        id: Math.random().toString(),
        timestamp: new Date(),
        level: 'warning' as const,
        endpoint: 'POST /deals',
        statusCode: 429,
        message: 'Rate limit exceeded. Retrying in 60 seconds.',
      },
      {
        id: Math.random().toString(),
        timestamp: new Date(),
        level: 'info' as const,
        endpoint: 'GET /deals',
        statusCode: 200,
        message: 'Successfully retrieved 15 deals',
      },
    ];

    setLogs([...logs, mockLogs[Math.floor(Math.random() * mockLogs.length)]]);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <Info className="h-5 w-5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50';
      default:
        return 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700';
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-900 dark:text-red-200';
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-200';
      case 'info':
        return 'text-[#141B41] dark:text-blue-200'; // Dark blue text in light mode!
      default:
        return 'text-slate-900 dark:text-slate-200';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#141B41] dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Wizard
            </button>
            <h1 className="text-3xl font-semibold text-[#141B41] dark:text-white">API Error & Drift Logs</h1>
          </div>
          <button
            onClick={addMockLog}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Simulate Log Entry
          </button>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <div className="flex flex-wrap gap-2">
              {(['all', 'error', 'warning', 'info'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterLevel === level
                      ? 'bg-[#141B41] text-white dark:bg-blue-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  {level !== 'all' && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-md text-xs">
                      {logs.filter(l => l.level === level).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track API errors and contract drift in real-time. When endpoint schemas change, we catch it and alert you.
          </p>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-16 text-center transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <Info className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-[#141B41] dark:text-white">No logs yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Once your MCP server is deployed and handling requests, logs will appear here.
            </p>
            <button
              onClick={addMockLog}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Simulate a Log Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className={`rounded-xl border p-4 transition-colors ${getLevelBg(log.level)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${getLevelTextColor(log.level)}`}>{log.endpoint}</span>
                          <span className="px-2 py-0.5 bg-white/60 dark:bg-slate-900/50 rounded-md text-xs border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
                            {log.statusCode}
                          </span>
                        </div>
                        <p className={`text-sm ${getLevelTextColor(log.level)} opacity-90`}>{log.message}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {(log.request || log.response) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.request && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Request</p>
                            <pre className="bg-white/60 dark:bg-slate-900/50 rounded-lg p-3 text-xs overflow-x-auto border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-300">
                              {JSON.stringify(log.request, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.response && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Response</p>
                            <pre className="bg-white/60 dark:bg-slate-900/50 rounded-lg p-3 text-xs overflow-x-auto border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-300">
                              {JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {logs.filter(l => l.level === 'error').length > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/50 rounded-xl p-5 transition-colors">
            <p className="text-sm text-orange-900 dark:text-orange-200">
              💡 <strong className="font-semibold">Schema Drift Detected:</strong> Some API calls are failing due to field name changes.
              Consider uploading an updated OpenAPI spec to resolve these errors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}