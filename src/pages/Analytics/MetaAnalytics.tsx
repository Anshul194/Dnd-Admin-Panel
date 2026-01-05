import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    MousePointerClick,
    Eye,
    ShoppingCart,
    Users,
    Target,
    BarChart3,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Percent,
    Activity,
    PieChart as PieChartIcon,
    RefreshCw,
    Database,
    Wifi,
    Download
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';
import axiosInstance from '../../services/axiosConfig';
import toast from 'react-hot-toast';

interface MetaMetrics {
    spend: number;
    clicks: number;
    impressions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    purchases: number;
    purchaseValue: number;
    totalLeads: number;
    ROAS: string;
    RPV: string;
    conversionRate: string;
    CPL: string;
    MER: string;
    CPP: string;
    PCR: string;
    RPI: string;
    RPL: string;
    CPML: string;
}

interface DateRange {
    since: string;
    until: string;
}

interface MetaAnalyticsResponse {
    success: boolean;
    data: {
        dateRange: DateRange;
        metrics: MetaMetrics;
        source?: 'cache' | 'real-time' | 'cache-partial';
        cached?: boolean;
    };
}

interface DailyMetric {
    date: string;
    metrics: MetaMetrics;
}

const MetaAnalytics: React.FC = () => {
    const [metrics, setMetrics] = useState<MetaMetrics | null>(null);
    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [source, setSource] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange>({
        since: getDefaultSinceDate(7),
        until: getYesterdayDate(),
    });
    const [selectedDays, setSelectedDays] = useState<number>(7);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                since: dateRange.since,
                until: dateRange.until,
                ...(forceRefresh && { forceRefresh: 'true' }),
            });

            const response = await axiosInstance.get<MetaAnalyticsResponse>(
                `/meta/metrics?${params}`
            );
            if (response.data.success) {
                setMetrics(response.data.data.metrics);
                setSource(response.data.data.source || 'real-time');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch metrics');
            toast.error('Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyMetrics = async () => {
        try {
            const response = await axiosInstance.get(
                `/meta/metrics/daily?since=${dateRange.since}&until=${dateRange.until}`
            );
            if (response.data.success) {
                setDailyMetrics(response.data.data.daily || []);
            }
        } catch (err: any) {
            console.error('Failed to fetch daily metrics:', err);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await axiosInstance.post('/meta/metrics/sync', {
                since: dateRange.since,
                until: dateRange.until,
                syncMissingOnly: true,
            });

            if (response.data.success) {
                toast.success(`✅ Synced ${response.data.syncedDates || 0} dates successfully!`);
                await fetchMetrics();
                await fetchDailyMetrics();
            } else {
                toast.error('❌ Sync failed: ' + response.data.error);
            }
        } catch (error: any) {
            console.error('Error syncing:', error);
            toast.error('❌ Sync failed: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        fetchDailyMetrics();
    }, [dateRange]);

    const handleDateRangeSelect = (days: number) => {
        setSelectedDays(days);
        setDateRange({
            since: getDefaultSinceDate(days),
            until: getYesterdayDate(),
        });
    };

    const handleCustomDateChange = (field: 'since' | 'until', value: string) => {
        setDateRange((prev) => ({ ...prev, [field]: value }));
        setSelectedDays(0); // Custom range
    };

    const handleRefresh = () => {
        fetchMetrics(true);
        fetchDailyMetrics();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-IN').format(value);
    };

    const formatMetric = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const kpiCards = metrics ? [
        {
            title: 'Total Spend',
            value: formatCurrency(metrics.spend),
            icon: <DollarSign className="w-6 h-6" />,
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
            trend: null,
        },
        {
            title: 'Total Revenue',
            value: formatCurrency(metrics.purchaseValue),
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            trend: '+' + formatMetric(metrics.ROAS) + 'x ROAS',
        },
        {
            title: 'Total Clicks',
            value: formatNumber(metrics.clicks),
            icon: <MousePointerClick className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            trend: metrics.ctr.toFixed(2) + '% CTR',
        },
        {
            title: 'Impressions',
            value: formatNumber(metrics.impressions),
            icon: <Eye className="w-6 h-6" />,
            color: 'from-purple-500 to-indigo-500',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
            trend: null,
        },
        {
            title: 'Total Purchases',
            value: formatNumber(metrics.purchases),
            icon: <ShoppingCart className="w-6 h-6" />,
            color: 'from-orange-500 to-amber-500',
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600',
            trend: formatMetric(metrics.conversionRate) + '% CVR',
        },
        {
            title: 'Total Leads',
            value: formatNumber(metrics.totalLeads),
            icon: <Users className="w-6 h-6" />,
            color: 'from-teal-500 to-cyan-500',
            bgColor: 'bg-teal-50',
            iconColor: 'text-teal-600',
            trend: '₹' + formatMetric(metrics.CPL) + ' CPL',
        },
    ] : [];

    const performanceMetrics = metrics ? [
        { label: 'ROAS', value: formatMetric(metrics.ROAS) + 'x', description: 'Return on Ad Spend', good: parseFloat(metrics.ROAS) > 3 },
        { label: 'MER', value: formatMetric(metrics.MER) + 'x', description: 'Marketing Efficiency Ratio', good: parseFloat(metrics.MER) > 3 },
        { label: 'CTR', value: metrics.ctr.toFixed(2) + '%', description: 'Click Through Rate', good: metrics.ctr > 2 },
        { label: 'CVR', value: formatMetric(metrics.conversionRate) + '%', description: 'Conversion Rate', good: parseFloat(metrics.conversionRate) > 2 },
        { label: 'CPC', value: '₹' + metrics.cpc.toFixed(2), description: 'Cost Per Click', good: metrics.cpc < 5 },
        { label: 'CPM', value: '₹' + metrics.cpm.toFixed(2), description: 'Cost Per Mille', good: metrics.cpm < 100 },
        { label: 'RPV', value: '₹' + formatMetric(metrics.RPV), description: 'Revenue Per Visit', good: parseFloat(metrics.RPV) > 10 },
        { label: 'CPL', value: '₹' + formatMetric(metrics.CPL), description: 'Cost Per Lead', good: parseFloat(metrics.CPL) < 200 },
        { label: 'CPP', value: '₹' + formatMetric(metrics.CPP), description: 'Cost Per Purchase', good: parseFloat(metrics.CPP) < 200 },
        { label: 'PCR', value: formatMetric(metrics.PCR) + '%', description: 'Purchase Conversion Rate', good: parseFloat(metrics.PCR) > 1 },
        { label: 'RPI', value: '₹' + formatMetric(metrics.RPI), description: 'Revenue Per Impression', good: true },
        { label: 'RPL', value: '₹' + formatMetric(metrics.RPL), description: 'Revenue Per Lead', good: parseFloat(metrics.RPL) > 500 },
    ] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Meta Analytics
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-gray-600 text-sm">Track your Facebook & Instagram ad performance</p>
                                        {source && (
                                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${source === 'cache'
                                                ? 'bg-green-100 text-green-700'
                                                : source === 'real-time'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {source === 'cache' ? (
                                                    <>
                                                        <Database className="w-3 h-3" />
                                                        Cached
                                                    </>
                                                ) : source === 'real-time' ? (
                                                    <>
                                                        <Wifi className="w-3 h-3" />
                                                        Real-time
                                                    </>
                                                ) : (
                                                    <>
                                                        <Database className="w-3 h-3" />
                                                        Partial Cache
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Controls */}
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            {/* Quick Date Range Selector */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Quick Select</label>
                                <select
                                    value={selectedDays}
                                    onChange={(e) => handleDateRangeSelect(parseInt(e.target.value))}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                >
                                    <option value={7}>Last 7 Days</option>
                                    <option value={14}>Last 14 Days</option>
                                    <option value={30}>Last 30 Days</option>
                                    <option value={60}>Last 60 Days</option>
                                    <option value={90}>Last 90 Days</option>
                                    <option value={0}>Custom Range</option>
                                </select>
                            </div>

                            {/* Custom Date Inputs */}
                            <div className="flex gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={dateRange.since}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            onChange={(e) => handleCustomDateChange('since', e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={dateRange.until}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            onChange={(e) => handleCustomDateChange('until', e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {/* Sync Button */}
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm"
                                    title="Sync missing data to cache"
                                >
                                    {syncing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <Database className="w-4 h-4" />
                                            Sync
                                        </>
                                    )}
                                </button>

                                {/* Refresh Button */}
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Refresh
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && !metrics && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Loading metrics...</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!loading && metrics && (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {kpiCards.map((card, index) => (
                                <div
                                    key={index}
                                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 ${card.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                                            <div className={card.iconColor}>{card.icon}</div>
                                        </div>
                                        {card.trend && (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                <ArrowUpRight className="w-3 h-3" />
                                                {card.trend}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Performance Metrics Grid */}
                        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Target className="w-6 h-6 text-blue-600" />
                                Performance Metrics
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {performanceMetrics.map((metric, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${metric.good
                                            ? 'bg-green-50 border-green-200 hover:border-green-300'
                                            : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                {metric.label}
                                            </span>
                                            {metric.good ? (
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            ) : (
                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                            )}
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                                        <p className="text-xs text-gray-500">{metric.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue & Spend Comparison */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Breakdown */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Revenue Breakdown
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                                            <p className="text-2xl font-bold text-green-700">{formatCurrency(metrics.purchaseValue)}</p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Revenue Per Purchase</p>
                                            <p className="text-2xl font-bold text-blue-700">₹{formatMetric(metrics.RPV)}</p>
                                        </div>
                                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Revenue Per Lead</p>
                                            <p className="text-2xl font-bold text-purple-700">₹{formatMetric(metrics.RPL)}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Cost Analysis */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-red-600" />
                                    Cost Analysis
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Total Spend</p>
                                            <p className="text-2xl font-bold text-red-700">{formatCurrency(metrics.spend)}</p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-red-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Cost Per Purchase</p>
                                            <p className="text-2xl font-bold text-orange-700">₹{formatMetric(metrics.CPP)}</p>
                                        </div>
                                        <ShoppingCart className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Cost Per Lead</p>
                                            <p className="text-2xl font-bold text-amber-700">₹{formatMetric(metrics.CPL)}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-amber-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Spend vs Revenue Bar Chart */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Spend vs Revenue
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={[
                                            {
                                                name: 'Financial Overview',
                                                Spend: metrics.spend,
                                                Revenue: metrics.purchaseValue,
                                                Profit: metrics.purchaseValue - metrics.spend
                                            }
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#059669" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Legend />
                                        <Bar dataKey="Spend" fill="url(#colorSpend)" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="Revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="Profit" fill="url(#colorProfit)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Traffic Funnel Bar Chart */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                    Traffic Funnel
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={[
                                            { name: 'Impressions', value: metrics.impressions, fill: '#a855f7' },
                                            { name: 'Clicks', value: metrics.clicks, fill: '#3b82f6' },
                                            { name: 'Leads', value: metrics.totalLeads, fill: '#14b8a6' },
                                            { name: 'Purchases', value: metrics.purchases, fill: '#10b981' }
                                        ]}
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="impressionsGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="clicksGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="leadsGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.6} />
                                            </linearGradient>
                                            <linearGradient id="purchasesGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#059669" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" stroke="#6b7280" />
                                        <YAxis dataKey="name" type="category" stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value: number) => formatNumber(value)}
                                        />
                                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                            {[
                                                { name: 'Impressions', value: metrics.impressions, fill: 'url(#impressionsGrad)' },
                                                { name: 'Clicks', value: metrics.clicks, fill: 'url(#clicksGrad)' },
                                                { name: 'Leads', value: metrics.totalLeads, fill: 'url(#leadsGrad)' },
                                                { name: 'Purchases', value: metrics.purchases, fill: 'url(#purchasesGrad)' }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart and Radar Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Performance Distribution Pie Chart */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                                    Revenue Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="pieGrad1" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#2563eb" />
                                            </linearGradient>
                                            <linearGradient id="pieGrad2" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#059669" />
                                            </linearGradient>
                                            <linearGradient id="pieGrad3" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="100%" stopColor="#dc2626" />
                                            </linearGradient>
                                            <linearGradient id="pieGrad4" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" />
                                                <stop offset="100%" stopColor="#d97706" />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={[
                                                { name: 'Profit', value: metrics.purchaseValue - metrics.spend },
                                                { name: 'Ad Spend', value: metrics.spend },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill="url(#pieGrad2)" />
                                            <Cell fill="url(#pieGrad3)" />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Cost Breakdown Radar Chart */}
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-pink-600" />
                                    Cost Metrics Analysis
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={[
                                        { metric: 'CPC', value: metrics.cpc, fullMark: 10 },
                                        { metric: 'CPM', value: Math.min(metrics.cpm / 10, 10), fullMark: 10 },
                                        { metric: 'CPL', value: Math.min(parseFloat(metrics.CPL) / 50, 10), fullMark: 10 },
                                        { metric: 'CPP', value: Math.min(parseFloat(metrics.CPP) / 50, 10), fullMark: 10 },
                                        { metric: 'CTR', value: metrics.ctr, fullMark: 10 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#be185d" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="metric" stroke="#6b7280" />
                                        <PolarRadiusAxis stroke="#6b7280" />
                                        <Radar
                                            name="Cost Metrics"
                                            dataKey="value"
                                            stroke="#ec4899"
                                            fill="url(#radarGrad)"
                                            fillOpacity={0.6}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Daily Performance Trend Chart */}
                        {dailyMetrics.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                    Daily Performance Trends
                                </h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart
                                        data={dailyMetrics.map((day) => ({
                                            date: day.date.split('-').slice(1).join('/'), // MM/DD format
                                            spend: parseFloat(day.metrics.spend.toFixed(2)),
                                            leads: day.metrics.totalLeads,
                                            ROAS: parseFloat(day.metrics.ROAS),
                                            clicks: day.metrics.clicks,
                                            revenue: day.metrics.purchaseValue,
                                        }))}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorSpendArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorLeadsArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                        <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="spend"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorSpendArea)"
                                            name="Daily Spend ($)"
                                        />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenueArea)"
                                            name="Daily Revenue ($)"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="ROAS"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{ r: 4 }}
                                            name="ROAS"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* No Daily Data Message */}
                        {dailyMetrics.length === 0 && !loading && (
                            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
                                <div className="text-center">
                                    <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Daily Data Available</h3>
                                    <p className="text-gray-500 mb-4">
                                        Click the "Sync" button to cache historical metrics for trend visualization.
                                    </p>
                                    <button
                                        onClick={handleSync}
                                        disabled={syncing}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium mx-auto"
                                    >
                                        {syncing ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Syncing Data...
                                            </>
                                        ) : (
                                            <>
                                                <Database className="w-5 h-5" />
                                                Sync Historical Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Key Insights */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6" />
                                Key Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                                    <p className="text-sm opacity-90 mb-1">ROAS</p>
                                    <p className="text-3xl font-bold">{metrics.ROAS}x</p>
                                    <p className="text-xs opacity-75 mt-1">Return on Ad Spend</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                                    <p className="text-sm opacity-90 mb-1">Profit</p>
                                    <p className="text-3xl font-bold">{formatCurrency(metrics.purchaseValue - metrics.spend)}</p>
                                    <p className="text-xs opacity-75 mt-1">Revenue - Spend</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                                    <p className="text-sm opacity-90 mb-1">Avg Order Value</p>
                                    <p className="text-3xl font-bold">{formatCurrency(metrics.purchaseValue / metrics.purchases)}</p>
                                    <p className="text-xs opacity-75 mt-1">Revenue / Purchases</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                                    <p className="text-sm opacity-90 mb-1">Lead to Purchase</p>
                                    <p className="text-3xl font-bold">{((metrics.purchases / metrics.totalLeads) * 100).toFixed(1)}%</p>
                                    <p className="text-xs opacity-75 mt-1">Purchase Conversion</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Helper functions
function getDefaultSinceDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

function getYesterdayDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

export default MetaAnalytics;
