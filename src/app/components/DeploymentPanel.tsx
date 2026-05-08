import { Rocket, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface DeploymentPanelProps {
  selectedCount: number;
  onDeploy: () => void;
  isDeploying: boolean;
}

export function DeploymentPanel({ selectedCount, onDeploy, isDeploying }: DeploymentPanelProps) {
  return (
    <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2">3. Deploy Your MCP Server</h2>
          <p className="text-gray-600">
            {selectedCount === 0
              ? 'Select at least one endpoint to deploy'
              : `Ready to deploy ${selectedCount} endpoint${selectedCount !== 1 ? 's' : ''} as MCP tools`
            }
          </p>
        </div>
        <button
          onClick={onDeploy}
          disabled={selectedCount === 0 || isDeploying}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isDeploying ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="h-5 w-5" />
              Deploy Server
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface DeploymentSuccessProps {
  serverUrl: string;
  apiKey: string;
  selectedCount: number;
}

export function DeploymentSuccess({ serverUrl, apiKey, selectedCount }: DeploymentSuccessProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = async (text: string, item: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const claudeDesktopConfig = `{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "${serverUrl}"
      ],
      "env": {
        "MCP_API_KEY": "${apiKey}"
      }
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "${serverUrl}"
      ],
      "env": {
        "MCP_API_KEY": "${apiKey}"
      }
    }
  }
}`;

  const windsurfConfig = `{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "${serverUrl}"
      ],
      "env": {
        "MCP_API_KEY": "${apiKey}"
      }
    }
  }
}`;

  const CopyButton = ({ text, item }: { text: string; item: string }) => (
    <button
      onClick={() => handleCopy(text, item)}
      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-2 transition-colors"
    >
      {copiedItem === item ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </button>
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 rounded-full p-2">
            <Check className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl text-green-900 mb-2">
              Successfully Deployed!
            </h2>
            <p className="text-green-800 mb-4">
              Your MCP server is live with {selectedCount} endpoint{selectedCount !== 1 ? 's' : ''}.
              Copy the configuration below to connect your AI client.
            </p>
            <div className="bg-white rounded border border-green-300 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Server URL</span>
                <CopyButton text={serverUrl} item="url" />
              </div>
              <code className="text-sm break-all">{serverUrl}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl mb-4">Client Configuration Snippets</h3>
        <p className="text-gray-600 mb-6">
          Choose your AI client and copy the configuration:
        </p>

        <div className="space-y-6">
          {/* Claude Desktop */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Claude Desktop</h4>
                <a
                  href="https://claude.ai/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Download
                </a>
              </div>
              <CopyButton text={claudeDesktopConfig} item="claude" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Add to: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS)
                or <code>%APPDATA%\Claude\claude_desktop_config.json</code> (Windows)
              </p>
              <pre className="text-xs overflow-x-auto">
                <code>{claudeDesktopConfig}</code>
              </pre>
            </div>
          </div>

          {/* Cursor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Cursor</h4>
                <a
                  href="https://cursor.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Download
                </a>
              </div>
              <CopyButton text={cursorConfig} item="cursor" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Add to: <code>~/.cursor/mcp.json</code> (macOS/Linux)
                or <code>%USERPROFILE%\.cursor\mcp.json</code> (Windows)
              </p>
              <pre className="text-xs overflow-x-auto">
                <code>{cursorConfig}</code>
              </pre>
            </div>
          </div>

          {/* Windsurf */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Windsurf</h4>
                <a
                  href="https://codeium.com/windsurf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Download
                </a>
              </div>
              <CopyButton text={windsurfConfig} item="windsurf" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Add to: <code>~/.windsurf/mcp_config.json</code> (macOS/Linux)
                or <code>%USERPROFILE%\.windsurf\mcp_config.json</code> (Windows)
              </p>
              <pre className="text-xs overflow-x-auto">
                <code>{windsurfConfig}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Next Steps:</strong>
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li>Copy the configuration for your preferred AI client</li>
          <li>Paste it into the configuration file (create the file if it doesn't exist)</li>
          <li>Restart your AI client to load the MCP server</li>
          <li>Your AI can now access all {selectedCount} selected endpoint{selectedCount !== 1 ? 's' : ''}!</li>
        </ul>
      </div>
    </div>
  );
}
