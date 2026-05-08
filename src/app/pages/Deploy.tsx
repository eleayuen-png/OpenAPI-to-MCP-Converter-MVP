import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DeploymentPanel, DeploymentSuccess } from '../components/DeploymentPanel';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';

export default function Deploy() {
  const navigate = useNavigate();
  // We added 'endpoints' and 'credentials' to this list!
  const { selectedEndpoints, endpoints, credentials, deploymentInfo, setDeploymentInfo, setLogs } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);

    try {
      // 1. Prepare the data to send to the backend
      const apiKeyToUse = credentials.length > 0 ? credentials[0].key : 'no-key-provided';
      
      const selectedEndpointDetails = endpoints.filter(ep => 
        selectedEndpoints.has(`${ep.method}:${ep.path}`)
      );

      // 2. Make the REAL network request to your Render backend
      // ⚠️ REPLACE THIS URL with your actual Render URL!
      const response = await fetch('https://mcp-proxy-backend.onrender.com/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeyToUse,
          endpoints: selectedEndpointDetails,
          baseUrl: 'https://api.example.com' // Replace with target API base URL later
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deploy server to backend');
      }

      const data = await response.json();

      // 3. Set the real deployment info returned from your server
      setDeploymentInfo({
        serverUrl: data.sseUrl,
        apiKey: apiKeyToUse, 
      });

      setLogs([
        {
          id: Math.random().toString(),
          timestamp: new Date(),
          level: 'info',
          endpoint: 'Server Deployment',
          statusCode: 200,
          message: `Successfully deployed MCP server with ID: ${data.serverId}`,
        },
      ]);

    } catch (error: any) {
      setDeployError(error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  if (selectedEndpoints.size === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800">No endpoints selected. Please go back and select endpoints.</p>
              <button
                onClick={() => navigate('/prune')}
                className="mt-2 text-sm text-yellow-700 underline"
              >
                Go to Prune Endpoints
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {deployError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">Deployment failed: {deployError}</p>
          </div>
        )}
        
        {!deploymentInfo ? (
          <>
            <DeploymentPanel
              selectedCount={selectedEndpoints.size}
              onDeploy={handleDeploy}
              isDeploying={isDeploying}
            />
            <div className="mt-6 flex justify-start">
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <DeploymentSuccess
            serverUrl={deploymentInfo.serverUrl}
            apiKey={deploymentInfo.apiKey}
            selectedCount={selectedEndpoints.size}
          />
        )}
      </div>
    </div>
  );
}
