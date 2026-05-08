import { CheckCircle2, Filter, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Endpoint } from './EndpointList';

interface EndpointPrunerProps {
  endpoints: Endpoint[];
  selectedEndpoints: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 border-green-300',
  POST: 'bg-blue-100 text-blue-800 border-blue-300',
  PUT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PATCH: 'bg-orange-100 text-orange-800 border-orange-300',
  DELETE: 'bg-red-100 text-red-800 border-red-300',
};

function getEndpointKey(endpoint: Endpoint): string {
  return `${endpoint.method}:${endpoint.path}`;
}

function getCategory(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return 'Root';
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

export function EndpointPruner({ endpoints, selectedEndpoints, onToggle, onToggleAll }: EndpointPrunerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, Endpoint[]>();
    endpoints.forEach(endpoint => {
      const category = getCategory(endpoint.path);
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(endpoint);
    });
    return categoryMap;
  }, [endpoints]);

  const filteredEndpoints = useMemo(() => {
    let filtered = endpoints;

    if (selectedCategory) {
      filtered = categories.get(selectedCategory) || [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        endpoint =>
          endpoint.path.toLowerCase().includes(query) ||
          endpoint.method.toLowerCase().includes(query) ||
          endpoint.summary?.toLowerCase().includes(query) ||
          endpoint.operationId?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [endpoints, categories, selectedCategory, searchQuery]);

  const selectedCount = selectedEndpoints.size;
  const totalCount = endpoints.length;

  const handleCategoryToggle = (category: string) => {
    const categoryEndpoints = categories.get(category) || [];
    const categoryKeys = categoryEndpoints.map(getEndpointKey);
    onToggleAll(categoryKeys);
  };

  const isCategorySelected = (category: string): boolean => {
    const categoryEndpoints = categories.get(category) || [];
    return categoryEndpoints.every(endpoint => selectedEndpoints.has(getEndpointKey(endpoint)));
  };

  if (endpoints.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl">
            2. Select Endpoints to Include
          </h2>
        </div>
        <div className="text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {selectedCount} of {totalCount} selected
          </span>
          <span className="ml-2 text-gray-500">
            (~{Math.round(selectedCount * 150)} tokens)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => onToggleAll(endpoints.map(getEndpointKey))}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {Array.from(categories.keys()).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category} ({categories.get(category)?.length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from(categories.entries()).map(([category, categoryEndpoints]) => {
          const visible = !selectedCategory || selectedCategory === category;
          if (!visible) return null;

          const filteredCategoryEndpoints = categoryEndpoints.filter(endpoint =>
            filteredEndpoints.includes(endpoint)
          );

          if (filteredCategoryEndpoints.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium">{category}</h3>
                  <span className="text-sm text-gray-500">
                    ({filteredCategoryEndpoints.length} endpoint{filteredCategoryEndpoints.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isCategorySelected(category) ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredCategoryEndpoints.map((endpoint) => {
                  const key = getEndpointKey(endpoint);
                  const isSelected = selectedEndpoints.has(key);

                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(key)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-xs uppercase border ${
                            methodColors[endpoint.method] || 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm flex-1">{endpoint.path}</code>
                        <span className="text-sm text-gray-600 max-w-md truncate">
                          {endpoint.summary || endpoint.operationId || '—'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEndpoints.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No endpoints match your search</p>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Context Window Tip:</strong> Selecting fewer endpoints keeps your LLM's context lean and prevents hallucinations.
          Each endpoint uses ~150 tokens on average.
        </p>
      </div>
    </div>
  );
}
