import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DeploymentPanel, DeploymentSuccess } from '../components/DeploymentPanel';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';

export default function Deploy() {
  const navigate = useNavigate();
  const { selectedEndpoints, deploymentInfo, setDeploymentInfo, setLogs } = useApp();
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);

    // Simulate deployment API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock deployment info
    const serverId = Math.random().toString(36).substring(2, 15);
    const apiKey = `mcp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    setDeploymentInfo({
      serverUrl: `https://mcp-gateway.example.com/servers/${serverId}`,
      apiKey,
    });

    // Add some mock logs
    setLogs([
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        endpoint: 'Server Deployment',
        statusCode: 200,
        message: `Successfully deployed MCP server with ${selectedEndpoints.size} endpoints`,
      },
    ]);

    setIsDeploying(false);
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
