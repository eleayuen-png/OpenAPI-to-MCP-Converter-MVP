import { CheckCircle2 } from 'lucide-react';

export interface Endpoint {
  method: string;
  path: string;
  summary?: string;
  operationId?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

interface EndpointListProps {
  endpoints: Endpoint[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-orange-100 text-orange-800',
  DELETE: 'bg-red-100 text-red-800',
};

export function EndpointList({ endpoints }: EndpointListProps) {
  if (endpoints.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl">
          Discovered {endpoints.length} Endpoint{endpoints.length !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {endpoints.map((endpoint, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs uppercase ${
                        methodColors[endpoint.method] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{endpoint.path}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {endpoint.summary || endpoint.operationId || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>✨ Next step: Configure these endpoints for MCP tool generation</p>
      </div>
    </div>
  );
}
