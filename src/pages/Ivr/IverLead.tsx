import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchLeadCallLogs } from '../../store/slices/calllog';
import { fetchRecordingLink } from '../../services/callService';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react';

const LeadRecordingPlayer = ({ recordingUrl }: { recordingUrl: string }) => {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const handlePlay = async () => {
    setFetching(true);
    try {
      const link = await fetchRecordingLink(recordingUrl);
      if (link) {
        setPlayingUrl(link);
      } else {
        toast.error("Failed to fetch recording");
      }
    } catch (e) {
      toast.error("Playback error");
    } finally {
      setFetching(false);
    }
  };

  if (playingUrl) {
    return <audio autoPlay controls className="w-full max-w-[200px]" src={playingUrl} />;
  }

  return (
    <button
      onClick={handlePlay}
      disabled={fetching}
      className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50"
    >
      {fetching ? (
        <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
      ) : (
        <Play className="w-4 h-4" />
      )}
      <span className="text-xs font-medium">{fetching ? "Fetching..." : "Play"}</span>
    </button>
  );
};

const IverLead = ({ leadId, onClose }: { leadId: string, onClose?: () => void }) => {
  const dispatch = useAppDispatch();
  const { leadCallLogs, leadCallLogsLoading, leadCallLogsError, leadCallLogsPagination } = useAppSelector(state => state.calllog);
  const [page, setPage] = useState(1);
  const limit = leadCallLogsPagination?.limit || 10;

  useEffect(() => {
    if (leadId) {
      dispatch(fetchLeadCallLogs({ leadId, page, limit }));
    }
  }, [dispatch, leadId, page, limit]);

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (duration?: string, durationMs?: number) => {
    if (duration && duration !== "0") {
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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Call Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Lead ID: {leadId || 'N/A'}</p>
        </div>
        {onClose && (
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition duration-200"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 md:p-6">
        {!leadId ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold text-gray-900">No call logs available</h3>
            <p className="mt-2 text-gray-500">Select a lead to view its call logs.</p>
          </div>
        ) : (
          <>
            {leadCallLogsLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                  <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                  <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                  <span className="text-gray-600 ml-2">Loading call logs...</span>
                </div>
              </div>
            )}

            {leadCallLogsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <span className="text-red-800 font-medium">Error: {leadCallLogsError}</span>
              </div>
            )}

            {!leadCallLogsLoading && !leadCallLogsError && (
              <>
                {leadCallLogs?.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['#', 'Call ID', 'Caller', 'Agent', 'Status', 'Duration', 'Recording', 'Created At'].map((col) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadCallLogs.map((log, idx) => (
                          <tr key={log._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-4 font-medium">{(page - 1) * limit + idx + 1}</td>
                            <td className="px-4 py-4 font-mono">{log.callId || 'N/A'}</td>
                            <td className="px-4 py-4">{log.caller || 'Unknown'}</td>
                            <td className="px-4 py-4">{log.agentName || 'N/A'}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(log.status || '')}`}>
                                {log.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-mono">{formatDuration(log.duration, log.durationMs)}</td>
                            <td className="px-4 py-4">
                              {log.recordingUrl ? (
                                <LeadRecordingPlayer recordingUrl={log.recordingUrl} />
                              ) : (
                                <span className="text-gray-400 italic">No recording</span>
                              )}
                            </td>
                            <td className="px-4 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <h3 className="text-lg font-semibold text-gray-900">No call logs found</h3>
                    <p className="mt-2 text-gray-500">There are no call logs for this lead.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>

  );
};

export default IverLead;
