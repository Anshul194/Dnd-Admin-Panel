// src/store/calllog.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// ====================== Types ======================
export interface CallLog {
  _id: string;
  callId: string;
  caller: string;
  receiver: string;
  duration?: string;
  durationMs?: number;
  status?: string;
  disposition?: string;
  recordingUrl?: string;
  agentName?: string;
  agentNumber?: string;
  agent?: any;
  leadId?: any;
  type?: string;   // incoming, outgoing, missed etc.
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status?: string;
  type?: string;
}

interface CallLogState {
  calllogs: CallLog[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
  filters: Filters;
  leadCallLogs: CallLog[];
  leadCallLogsLoading: boolean;
  leadCallLogsError: string | null;
  leadCallLogsPagination?: Pagination;
}

// ====================== Initial State ======================
const initialState: CallLogState = {
  calllogs: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  searchQuery: "",
  filters: {},
  leadCallLogs: [], // <-- Add this line
  leadCallLogsLoading: false, // <-- Add this line
  leadCallLogsError: null, // <-- Add this line
};

// ====================== Async Thunk ======================

// Fetch Call Logs
// ====================== Async Thunk ======================

// Fetch Call Logs
export const fetchCallLogs = createAsyncThunk(
  "calllog/fetchCallLogs",
  async (params: any, { rejectWithValue }) => {
    try {
      const { filters, ...rest } = params;
      const queryParams = {
        ...rest,
        ...(filters || {}),
      };

      const response = await axiosInstance.get("/calllog", {
        params: queryParams,
        headers: { "x-tenant": getTenantFromURL() },
      });

      // ✅ handle multiple possible API structures
      const callLogs =
        response.data?.callLogs || response.data?.data?.callLogs || [];
      const pagination =
        response.data?.pagination || response.data?.data?.pagination || {};

      console.log("Fetched call logs (parsed):", callLogs);

      return {
        data: callLogs,
        pagination: {
          page: pagination.currentPage || 1,
          limit: pagination.itemsPerPage || 10,
          total: pagination.totalItems || 0,
          totalPages: pagination.totalPages || 1,
        },
      };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);


// Fetch Call Logs for a specific lead
export const fetchLeadCallLogs = createAsyncThunk(
  "calllog/fetchLeadCallLogs",
  async (params: string | { leadId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      let leadId: string;
      let page: number | undefined;
      let limit: number | undefined;

      if (typeof params === "string") {
        leadId = params;
      } else {
        leadId = params.leadId;
        page = params.page;
        limit = params.limit;
      }

      const queryParams: any = {};
      if (page) queryParams.page = page;
      if (limit) queryParams.limit = limit;

      const response = await axiosInstance.get(`/calllog/lead/${leadId}`, {
        params: queryParams,
        headers: { "x-tenant": getTenantFromURL() },
      });

      // Support pagination if returned
      const callLogs = response.data.callLogs || [];
      const pagination = response.data.pagination || {};

      return {
        callLogs,
        pagination: {
          page: pagination.currentPage || 1,
          limit: pagination.itemsPerPage || 10,
          total: pagination.totalItems || callLogs.length,
          totalPages: pagination.totalPages || 1,
        },
      };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// ====================== Slice ======================
const calllogSlice = createSlice({
  name: "calllog",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.pagination.page = 1;
    },
    setFilters: (state, action: PayloadAction<Filters>) => {
      state.filters = action.payload;
      state.pagination.page = 1;
    },
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {};
      state.searchQuery = "";
      state.pagination.page = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLeadCallLogs: (state) => {
      state.leadCallLogs = [];
      state.leadCallLogsError = null;
      state.leadCallLogsLoading = false;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchCallLogs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCallLogs.fulfilled, (state, action) => {
      state.loading = false;
      state.calllogs = action.payload.data || [];
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    });
    builder.addCase(fetchCallLogs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(fetchLeadCallLogs.pending, (state) => {
      state.leadCallLogsLoading = true;
      state.leadCallLogsError = null;
    });
    builder.addCase(fetchLeadCallLogs.fulfilled, (state, action) => {
      state.leadCallLogsLoading = false;
      // Support both old and new payload shape
      if (action.payload?.callLogs) {
        state.leadCallLogs = action.payload.callLogs;
        state.leadCallLogsPagination = action.payload.pagination;
      } else {
        state.leadCallLogs = action.payload || [];
        state.leadCallLogsPagination = undefined;
      }
    });
    builder.addCase(fetchLeadCallLogs.rejected, (state, action) => {
      state.leadCallLogsLoading = false;
      state.leadCallLogsError = action.payload as string;
    });
  },
});

export const {
  setSearchQuery,
  setFilters,
  setPagination,
  resetFilters,
  clearError,
  clearLeadCallLogs, // <-- Add this line
} = calllogSlice.actions;

export default calllogSlice.reducer;
