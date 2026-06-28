import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, Users, Server, Zap, Eye,
  RefreshCw, ShieldAlert, ArrowLeft, Radio, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';

const BACKEND_URL = 'https://mcp-backend-q8y7.onrender.com';

interface Summary {
  pageviews_7d: number;
  pageviews_30d: number;
  unique_users_7d: number;
  unique_users_30d: number;
  deployments_7d: number;
  upgrade_clicks_7d: number;
}

interface TimeseriesPoint {
  date: string;
  pageviews: number;
  deployments: number;
}

interface LiveEvent {
  id: string;
  event: string;
  distinct_id: string;
  timestamp: string;
  properties: { url?: string; browser?: string; os?: string };
}

export default function Analytics() {
  const { user, isAdmin } = useApp();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user || !isAdmin) return;
    try {
      const token = await (user as any).getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [sRes, tRes, lRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analytics/summary`, { headers }),
        fetch(`${BACKEND_URL}/api/analytics/timeseries`, { headers }),
        fetch(`${BACKEND_URL}/api/analytics/live`, { headers }),
      ]);

      if (sRes.status === 401 || sRes.status === 403) {
        setError('Not authorized. Admin access required.');
        setLoading(false);
        return;
      }
      if (!sRes.ok) throw new Error(`Server error: ${sRes.status}`);

      setSummary(await sRes.json());
      setTimeseries(await tRes.json());
      setLiveEvents(await lRes.json());
      setLastUpdated(new Date());
      setSecondsAgo(0);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !user) {
      setLoading(false);
      return;
    }
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [isAdmin, user, fetchAll]);

  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-16">
        <ShieldAlert className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#141B41] dark:text-white mb-2">
          Admin Access Required
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          This page is restricted to platform administrators.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#141B41] text-white rounded-lg hover:bg-[#1e2a5e] transition-colors"
        >
          Back to app
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-500 hover:text-[#141B41] dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#141B41] dark:text-white">
              Platform Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Admin only · Platform-wide traffic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Updated {secondsAgo}s ago
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
            <Radio className="h-3 w-3 animate-pulse" />
            Live · 30s
          </div>
          <button
            onClick={fetchAll}
            className="p-2 text-slate-500 hover:text-[#141B41] dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
            title="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<Eye className="h-5 w-5" />}
            label="Pageviews"
            value={summary.pageviews_7d}
            sub={`${summary.pageviews_30d.toLocaleString()} last 30d`}
            colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            label="Unique Users"
            value={summary.unique_users_7d}
            sub={`${summary.unique_users_30d.toLocaleString()} last 30d`}
            colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          />
          <MetricCard
            icon={<Server className="h-5 w-5" />}
            label="Deployments"
            value={summary.deployments_7d}
            sub="last 7 days"
            colorClass="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          />
          <MetricCard
            icon={<Zap className="h-5 w-5" />}
            label="Upgrade Clicks"
            value={summary.upgrade_clicks_7d}
            sub="last 7 days"
            colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeseries Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-[#141B41] dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Pageviews — Last 7 Days
          </h3>
          {timeseries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeseries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="deployments"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data yet
            </div>
          )}
          <div className="flex gap-5 mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Pageviews
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> Deployments
            </span>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-[#141B41] dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Live Events (24h)
          </h3>
          <div className="space-y-0 overflow-y-auto max-h-64">
            {liveEvents.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">
                No events in the last 24h
              </p>
            ) : (
              liveEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <EventBadge eventName={event.event} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {event.event}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {event.distinct_id.slice(0, 16)}…
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClass}`}>{icon}</div>
      <p className="text-2xl font-bold text-[#141B41] dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function EventBadge({ eventName }: { eventName: string }) {
  const styleMap: Record<string, string> = {
    $pageview: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    server_deployed: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    pro_upgrade_clicked: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };
  const cls =
    styleMap[eventName] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
  const short = eventName.startsWith('$')
    ? eventName.slice(1, 3).toUpperCase()
    : eventName.slice(0, 2).toUpperCase();

  return (
    <span
      className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${cls}`}
    >
      {short}
    </span>
  );
}
