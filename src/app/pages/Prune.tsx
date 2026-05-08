import { useNavigate } from 'react-router';
import { EndpointPruner } from '../components/EndpointPruner';
import { useApp } from '../context/AppContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function Prune() {
  const navigate = useNavigate();
  const { endpoints, selectedEndpoints, setSelectedEndpoints } = useApp();

  const handleToggleEndpoint = (key: string) => {
    setSelectedEndpoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleToggleAllEndpoints = (keys: string[]) => {
    setSelectedEndpoints(prev => {
      const allSelected = keys.every(key => prev.has(key));
      const newSet = new Set(prev);

      if (allSelected) {
        keys.forEach(key => newSet.delete(key));
      } else {
        keys.forEach(key => newSet.add(key));
      }

      return newSet;
    });
  };

  if (endpoints.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800">No endpoints loaded. Please upload an OpenAPI spec first.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-sm text-yellow-700 underline"
              >
                Go to Upload
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
        <EndpointPruner
          endpoints={endpoints}
          selectedEndpoints={selectedEndpoints}
          onToggle={handleToggleEndpoint}
          onToggleAll={handleToggleAllEndpoints}
        />

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate('/macro-tools')}
            disabled={selectedEndpoints.size === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Continue to Macro Tools
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
