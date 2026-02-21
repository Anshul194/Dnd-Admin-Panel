import React, { useState, useEffect, useCallback } from "react";
import { fetchShipmentDashboard } from "../../services/shipmentDashboardService";
import { Package, CheckCircle, XCircle, AlertTriangle, Truck, Calendar as CalendarIcon } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import DatePicker from "../../components/form/date-picker";

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

  // Extract metrics based on the provided JSON structure
  const metrics = data?.data?.data?.overall || data?.data?.overall || (data as any)?.overall;

  // Prepare events for the calendar (demo purposes since API doesn't provide daily breakdown yet)
  // In a real scenario, you'd map individual shipments to events
  const calendarEvents = metrics ? [
    { title: `Delivered: ${metrics.delivered}`, start: today, color: '#10b981' },
    { title: `Dispatched: ${metrics.dispatched}`, start: today, color: '#6366f1' },
  ] : [];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 text-violet-700 rounded-lg">
            <Truck size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Shipment Dashboard</h2>
        </div>
        {loading && <div className="text-violet-600 font-medium animate-pulse text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-violet-600 rounded-full animate-ping"></div>
          Updating data...
        </div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Platform</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white shadow-sm transition-all"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
          >
            {platforms.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <DatePicker
            id="from-date"
            label="From Date"
            placeholder="Select start date"
            defaultDate={from}
            onChange={(selectedDates: Date[]) => {
              if (selectedDates[0]) {
                const dateStr = selectedDates[0].toISOString().split('T')[0];
                setFrom(dateStr);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <DatePicker
            id="to-date"
            label="To Date"
            placeholder="Select end date"
            defaultDate={to}
            onChange={(selectedDates: Date[]) => {
              if (selectedDates[0]) {
                const dateStr = selectedDates[0].toISOString().split('T')[0];
                setTo(dateStr);
              }
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {metrics ? (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Overall Metrics</h3>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CalendarIcon size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-700">Shipment Calendar</h3>
            </div>
            <div className="p-4 custom-calendar shipment-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth",
                }}
                events={calendarEvents}
                height="auto"
                aspectRatio={2}
              />
            </div>
          </div>

          <div className="mt-6">
            <details className="bg-gray-50 rounded-lg p-3 group border border-gray-100 transition-all">
              <summary className="cursor-pointer font-medium text-gray-600 text-sm group-open:mb-4 flex items-center justify-between">
                <span>View Raw JSON Response</span>
                <ChevronDownIcon className="group-open:rotate-180 transition-transform" />
              </summary>
              <pre className="text-xs text-gray-800 overflow-x-auto p-4 bg-gray-900 text-gray-100 rounded-lg border shadow-inner custom-scrollbar">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div className="text-center py-20 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            Fetching dashboard data...
          </div>
        )
      )}
    </div>
  );
}

function StatsCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`p-4 rounded-xl border ${color} flex items-center justify-between shadow-sm transition-all hover:shadow-md hover:scale-[1.02] cursor-default`}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{title}</p>
        <p className="text-3xl font-extrabold tabular-nums">{value}</p>
      </div>
      <div className="p-3 bg-white bg-opacity-30 rounded-xl backdrop-blur-sm">
        {icon}
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
