import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchCallLogs,
  setSearchQuery,
  setFilters,
  setPagination,
  resetFilters,
} from "../../store/slices/calllog";
import { CallLog } from "../../store/slices/calllog";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Phone,
  Clock,
  User,
  Calendar,
  Play,
  ExternalLink,
  Headphones,
  UserCheck,
  Target,
  Hash,
  Download,
  PhoneCall
} from "lucide-react";
import IverLead from './IverLead';
import { useNavigate } from "react-router-dom";
import { initiateCall, fetchRecordingLink } from "../../services/callService";
import toast from "react-hot-toast";

// Updated status options based on API data
const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ANSWERED", label: "Answered" },
  { value: "ANSWER", label: "Answer" },
  { value: "CANCEL", label: "Cancelled" },
  { value: "MISSED", label: "Missed" },
];

// Updated disposition options based on API data
const dispositionOptions = [
  { value: "", label: "All Dispositions" },
  { value: "Interested", label: "Interested" },
  { value: "received", label: "Received" },
  { value: "missed", label: "Missed" },
];

const getStatusBadge = (status?: string) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    "ANSWERED": { bg: "bg-green-100", text: "text-green-800" },
    "ANSWER": { bg: "bg-green-100", text: "text-green-800" },
    "CANCEL": { bg: "bg-red-100", text: "text-red-800" },
    "MISSED": { bg: "bg-yellow-100", text: "text-yellow-800" },
  };
  const config = statusConfig[status || "ANSWERED"] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {status}
    </span>
  );
};

const getDispositionBadge = (disposition?: string) => {
  const dispositionConfig: Record<string, { bg: string; text: string }> = {
    "Interested": { bg: "bg-blue-100", text: "text-blue-800" },
    "received": { bg: "bg-green-100", text: "text-green-800" },
    "missed": { bg: "bg-red-100", text: "text-red-800" },
  };
  const config = dispositionConfig[disposition || "received"] || { bg: "bg-gray-100", text: "text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {disposition}
    </span>
  );
};

const formatDuration = (duration?: string, durationMs?: number) => {
  if (duration && duration !== "0") {
    // Handle formats like "35" (seconds) or "00:01:12" (HH:MM:SS)
    if (duration.includes(":")) {
      return duration;
    } else {
      const seconds = parseInt(duration);
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      return `${duration}s`;
    }
  }
  if (durationMs) {
    const seconds = Math.floor(durationMs / 1000);
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }
  return "-";
};

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone) return "-";
  // Format Indian phone numbers
  if (phone.startsWith("+91")) {
    return phone.replace("+91", "+91 ").replace(/(\d{5})(\d{5})/, "$1 $2");
  }
  if (phone.startsWith("91") && phone.length === 12) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
  }
  return phone;
};

// Detail Modal Component
const CallDetailModal: React.FC<{
  callLog: CallLog | null,
  isOpen: boolean,
  onClose: () => void
}> = ({ callLog, isOpen, onClose }) => {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [fetchingLink, setFetchingLink] = useState(false);

  useEffect(() => {
    // Reset playing URL when a different call log is selected
    setPlayingUrl(null);
  }, [callLog?._id]);

  const handleFetchRecording = async () => {
    if (!callLog?.recordingUrl) {
      toast.error("No recording URL found for this call");
      return;
    }

    setFetchingLink(true);
    try {
      const link = await fetchRecordingLink(callLog.recordingUrl);
      if (link) {
        setPlayingUrl(link);
        toast.success("Recording link retrieved successfully");
      } else {
        toast.error("Failed to retrieve playback link");
      }
    } catch (error) {
      toast.error("Error connecting to recording service");
    } finally {
      setFetchingLink(false);
    }
  };

  if (!isOpen || !callLog) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-[1000010] p-4 mt-22">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Phone className="w-6 h-6" />
              Call Details
            </h2>
            <button
              onClick={() => {
                setPlayingUrl(null);
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Call Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Call Information</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Call ID:</span>
                    <p className="font-mono text-sm">{callLog.callId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Caller:</span>
                    <p className="font-semibold">{formatPhoneNumber(callLog.caller)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Duration:</span>
                    <p className="font-semibold">{formatDuration(callLog.duration, callLog.durationMs)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className="mt-1">{getStatusBadge(callLog.status)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Disposition:</span>
                    <div className="mt-1">{getDispositionBadge(callLog.disposition)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-500">Created At:</span>
                    <p>{new Date(callLog.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent & Lead Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Agent & Lead Details</h3>

              <div className="space-y-4">
                {/* Agent Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Agent Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-blue-600">Name:</span>
                      <span className="ml-2 font-medium">{callLog.agentName || 'Not Assigned'}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Number:</span>
                      <span className="ml-2 font-medium">{formatPhoneNumber(callLog.agentNumber)}</span>
                    </div>
                    {callLog.agent && (
                      <>
                        <div>
                          <span className="text-blue-600">Email:</span>
                          <span className="ml-2">{callLog.agent.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${callLog.agent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {callLog.agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Lead Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Lead Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-green-600">Phone:</span>
                      <span className="ml-2 font-medium">{formatPhoneNumber(callLog.leadId?.phone)}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Full Name:</span>
                      <span className="ml-2">{callLog.leadId?.fullName || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Email:</span>
                      <span className="ml-2">{callLog.leadId?.email || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Source:</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {callLog.leadId?.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {callLog.leadId?.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Converted:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${callLog.leadId?.converted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {callLog.leadId?.converted ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Follow-up Count:</span>
                      <span className="ml-2 font-medium">{callLog.leadId?.followUpCount || 0}</span>
                    </div>
                    {callLog.leadId?.lastContactedAt && (
                      <div>
                        <span className="text-green-600">Last Contacted:</span>
                        <span className="ml-2 text-xs">
                          {new Date(callLog.leadId.lastContactedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recording Section */}
          {callLog.recordingUrl && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                Call Recording
              </h4>
              <div className="flex flex-col gap-4">
                {playingUrl ? (
                  <audio
                    autoPlay
                    controls
                    className="w-full"
                    src={playingUrl}
                  />
                ) : (
                  <button
                    onClick={handleFetchRecording}
                    disabled={fetchingLink}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {fetchingLink ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    {fetchingLink ? "Fetching recording..." : "Play Recording"}
                  </button>
                )}
                <p className="text-xs text-purple-600 italic">
                  Note: Recording links are temporary and generated on demand.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IvrLogs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { calllogs, loading, error, pagination, searchQuery, filters } = useAppSelector((state) => state.calllog);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadIdForModal, setLeadIdForModal] = useState<string | null>(null);
  const [initiatingCall, setInitiatingCall] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, dispatch]);

  useEffect(() => {
    const activeFilters = {
      ...(localFilters.status ? { status: localFilters.status } : {}),
      ...(localFilters.disposition ? { disposition: localFilters.disposition } : {}),
    };
    dispatch(
      fetchCallLogs({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
        search: searchInput || "",
      })
    );
  }, [dispatch, pagination.page, pagination.limit, searchInput, localFilters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(
        fetchCallLogs({
          page: newPage,
          limit: pagination.limit,
          filters: {
            ...(localFilters.status ? { status: localFilters.status } : {}),
            ...(localFilters.disposition ? { disposition: localFilters.disposition } : {}),
          },
          search: searchInput || "",
        })
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(
      fetchCallLogs({
        page: 1,
        limit: newLimit,
        filters: {
          ...(localFilters.status ? { status: localFilters.status } : {}),
          ...(localFilters.disposition ? { disposition: localFilters.disposition } : {}),
        },
        search: searchInput || "",
      })
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    dispatch(setFilters(updated));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setLocalFilters({});
    dispatch(resetFilters());
  };

  const handleViewDetails = (callLog: CallLog) => {
    setSelectedCallLog(callLog);
    setIsDetailModalOpen(true);
  };

  const handleInitiateCall = async (leadId: string) => {
    if (!leadId) {
      toast.error("Lead ID is required to initiate a call");
      return;
    }

    setInitiatingCall(leadId);
    try {
      // Get current user to ensure call connects to them
      let agentId = undefined;
      let agentNumber = undefined;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log("DEBUG: Full user object from localStorage:", user);
          agentId = user._id || user.id;
          // Fallback to user-provided number if missing in profile
          agentNumber = user.phone || user.phoneNumber || user.mobile || "9824853820";
          console.log("DEBUG: Resolved agentId:", agentId, "agentNumber:", agentNumber);
        } else {
          console.warn("DEBUG: No user found in localStorage");
          // Fallback even if no user found (though unlikely for logged in app)
          agentNumber = "9824853820";
        }
      } catch (e) {
        console.warn("Could not retrieve current user for call initiation", e);
        agentNumber = "9824853820";
      }

      const response = await initiateCall(leadId, agentId, agentNumber);
      toast.success(response.message || "Call initiated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate call");
      console.error("Error initiating call:", error);
    } finally {
      setInitiatingCall(null);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    const maxPages = 5;
    const start = Math.max(1, current - Math.floor(maxPages / 2));
    const end = Math.min(totalPages, start + maxPages - 1);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  };

  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 xl:px-10 xl:py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">IVR Call Logs</h1>
          <span className="text-gray-500 text-sm">Total: {pagination.total}</span>
        </div>

        <div className="bg-white shadow p-4 rounded-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by caller, agent, call ID..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Disposition:</span>
              <select
                value={localFilters.disposition || ""}
                onChange={(e) => handleFilterChange("disposition", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {dispositionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disposition</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!calllogs || calllogs.length === 0) ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-500">
                      No IVR call logs found.
                    </td>
                  </tr>
                ) : (
                  calllogs.map((log, idx) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{log.callId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatPhoneNumber(log.caller)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{log.agentName}</span>
                            <div className="text-xs text-gray-500">{formatPhoneNumber(log.agentNumber)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDuration(log.duration, log.durationMs)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        {getDispositionBadge(log.disposition)}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.recordingUrl ? (
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="flex items-center gap-2 hover:bg-green-50 p-1.5 rounded-md transition-colors group border border-transparent hover:border-green-200"
                            title="Play Recording"
                          >
                            <Play className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-green-600 font-medium">Play</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Not Available</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 hover:bg-indigo-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (log.leadId?._id) {
                                setLeadIdForModal(log.leadId._id);
                                setLeadModalOpen(true);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 hover:bg-green-50 transition-colors"
                            title="View Lead Call Logs"
                            disabled={!log.leadId?._id}
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => log.leadId?._id && handleInitiateCall(log.leadId._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Initiate Call"
                            disabled={!log.leadId?._id || initiatingCall === log.leadId?._id}
                          >
                            {initiatingCall === log.leadId?._id ? (
                              <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                            ) : (
                              <PhoneCall className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {generatePageNumbers().map((page, idx) =>
              typeof page === "number" ? (
                <button
                  key={idx}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md border transition-colors ${pagination.page === page
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-2 text-gray-400">
                  {page}
                </span>
              )
            )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <CallDetailModal
        callLog={selectedCallLog}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCallLog(null);
        }}
      />
      {/* IverLead Modal */}
      {leadModalOpen && leadIdForModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1000010] p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-200">
            <IverLead leadId={leadIdForModal} onClose={() => {
              setLeadModalOpen(false);
              setLeadIdForModal(null);
            }} />
          </div>
        </div>
      )}

    </div>
  );
};

export default IvrLogs;