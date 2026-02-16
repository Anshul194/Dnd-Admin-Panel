import React, { useState, useEffect, useCallback } from "react";
import { fetchShipmentDashboard } from "../../services/shipmentDashboardService";
import { Package, CheckCircle, XCircle, AlertTriangle, Truck } from "lucide-react";

interface DashboardData {
  overall: {
    totalParcels: number;
    delivered: number;
    cancelled: number;
    rto: number;
    dispatched: number;
  };
  byPlatform: any[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

const platforms = [
  { label: "All Platforms", value: "all" },
  { label: "DTDC", value: "dtdc" },
  { label: "Bluedart", value: "bluedart" },
  { label: "Delivery", value: "delivery" },
];

export default function ShipmentDashboard() {
  // Default to today and 30 days ago to ensure an initial fetch
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [platform, setPlatform] = useState("all");
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const tenant = "bharat";
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    if (!from || !to) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShipmentDashboard({ platform, from, to }, tenant);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  }, [platform, from, to, tenant]);

  // Fetch data automatically whenever platform or dates change
  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  // Extract metrics based on the provided JSON structure:
  // result -> data -> data -> overall
  const metrics = data?.data?.data?.overall || data?.data?.overall || (data as any)?.overall;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Shipment Dashboard</h2>
        {loading && <div className="text-violet-600 font-medium animate-pulse text-sm">Updating data...</div>}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Platform</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white shadow-sm"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
          >
            {platforms.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">From Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white shadow-sm"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">To Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white shadow-sm"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {metrics ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Overall Metrics</h3>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded uppercase">
              {platform}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Parcels"
              value={metrics.totalParcels}
              color="bg-blue-50 text-blue-700 border-blue-200"
              icon={<Package size={20} />}
            />
            <StatsCard
              title="Dispatched"
              value={metrics.dispatched}
              color="bg-indigo-50 text-indigo-700 border-indigo-200"
              icon={<Truck size={20} />}
            />
            <StatsCard
              title="Delivered"
              value={metrics.delivered}
              color="bg-green-50 text-green-700 border-green-200"
              icon={<CheckCircle size={20} />}
            />
            <StatsCard
              title="Cancelled"
              value={metrics.cancelled}
              color="bg-red-50 text-red-700 border-red-200"
              icon={<XCircle size={20} />}
            />
            <StatsCard
              title="RTO"
              value={metrics.rto}
              color="bg-orange-50 text-orange-700 border-orange-200"
              icon={<AlertTriangle size={20} />}
            />
          </div>

          <div className="mt-6">
            <details className="bg-gray-50 rounded-lg p-3 group">
              <summary className="cursor-pointer font-medium text-gray-600 text-sm group-open:mb-2">View Raw JSON Response</summary>
              <pre className="mt-2 text-xs text-gray-800 overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg border shadow-inner">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div className="text-center py-20 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
            Fetching dashboard data...
          </div>
        )
      )}
    </div>
  );
}

function StatsCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`p-4 rounded-lg border ${color} flex items-center justify-between shadow-sm transition-transform hover:scale-[1.02]`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="p-2 bg-white bg-opacity-40 rounded-full">
        {icon}
      </div>
    </div>
  );
}
