import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// Staff interface for populated assignedTo field
export interface AssignedStaff {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  isVerified: boolean;
  role: string;
  tenant: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  __v?: number;
}

// Interfaces
export interface Lead {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone: string;
  source?:
  | "website"
  | "newsletter"
  | "popup"
  | "referral"
  | "manual"
  | "other"
  | "IVR"
  | "facebook_lead_ads";
  status: "new" | "contacted" | "assigned" | "qualified" | "converted" | "lost";
  description?: string;
  category?: string;
  department?: string;
  expectedPrice?: number;
  media?: string;
  products?: string[];
  lastRemark?: string;
  tags?: string[];
  notes?: Array<{
    _id?: string;
    note: string;
    createdAt: string | Date;
    createdBy?: string;
  }>;
  assignedTo?: string | AssignedStaff; // Can be either ID (string) or populated staff object
  assignedToName?: string; // Optional: Add this if you want to store the name separately for display
  convertedTo?: string | null;
  converted?: boolean;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  lastCallStatus?: string;
  followUpCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface FetchLeadParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
  sort?: Record<string, "asc" | "desc">;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
  filters: Record<string, any>;
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  searchQuery: "",
  filters: {},
};

// Create lead
export const createLead = createAsyncThunk<Lead, Partial<Lead>>(
  "leads/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/crm/leads", data, {
        headers: {
          "x-tenant": getTenantFromURL(),
          "Content-Type": "application/json",
        },
      });

      const responseData = response.data;

      // Detailed logging for debugging
      console.log("Create Lead - API Response:", responseData);

      // Handle both wrapped { success, data } and unwrapped results
      const leadData = responseData && typeof responseData === 'object' && 'success' in responseData
        ? responseData.data
        : responseData;

      const isSuccess = responseData && typeof responseData === 'object' && 'success' in responseData
        ? responseData.success
        : !!responseData;

      if (isSuccess) {
        return leadData;
      } else {
        return rejectWithValue(responseData.message || "Failed to create lead.");
      }
    } catch (error: any) {
      console.error("❌ createLead error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    }
  }
);

// Fetch leads
export const fetchLeads = createAsyncThunk<
  { leads: Lead[]; pagination: Pagination },
  FetchLeadParams
>("leads/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) queryParams.append("search", search);
    if (sortField) queryParams.append("sortBy", sortField);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    // Add filters to query params
    if (filters && Object.keys(filters).length > 0) {
      queryParams.append("filters", JSON.stringify(filters));
    }

    const response = await axiosInstance.get(
      `/crm/leads?${queryParams.toString()}`,
      {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      }
    );

    const data = response.data;
    console.log("Fetched Leads - Full Response:", data);
    console.log("Fetched Leads - Data Structure:", data?.data);

    const success = data;
    console.log("Fetched Leads - Success:", success);

    if (success) {
      // Extract leads from the actual API response structure
      const leadsData = data?.leads || [];
      const currentPage = data?.currentPage || 1;

      console.log("Extracted Leads Data:", leadsData);
      console.log("Current Page:", currentPage);
      console.log(
        "Total Documents:",
        data?.data?.totalDocuments || data?.totalDocuments || leadsData.length
      );
      console.log(
        "Total Pages:",
        data?.data?.totalPages ||
        data?.totalPages ||
        Math.ceil(leadsData.length / limit)
      );

      return {
        leads: leadsData,
        pagination: {
          total:
            data?.totalDocuments || data?.totalDocuments || leadsData.length,
          page: currentPage,
          limit,
          totalPages:
            data?.totalPages ||
            data?.totalPages ||
            Math.ceil(leadsData.length / limit),
        },
      };
    } else {
      return rejectWithValue("Failed to fetch leads.");
    }
  } catch (error: any) {
    console.error("❌ fetchLeads error:", error);
    return rejectWithValue(
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  }
});

// Fetch lead by ID
export const fetchLeadById = createAsyncThunk<Lead, string>(
  "leads/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/crm/leads/${id}`, {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      });
      console?.log("lead by Id1", response.data);

      const leadData = response.data;
      console?.log("lead by Id d", leadData);

      if (leadData) {
        return leadData;
      } else {
        return rejectWithValue("Failed to fetch lead.");
      }
    } catch (error: any) {
      console.error("❌ fetchLeadById error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    }
  }
);

// Update lead
export const updateLead = createAsyncThunk<
  Lead,
  { id: string; data: Partial<Lead> }
>("leads/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/crm/leads/${id}`, data, {
      headers: {
        "x-tenant": getTenantFromURL(),
        "Content-Type": "application/json",
      },
    });

    console.log("response", response.data);

    const leadData = response.data;

    if (leadData) {
      return leadData;
    } else {
      return rejectWithValue("Failed to update lead.");
    }
  } catch (error: any) {
    console.error("❌ updateLead error:", error);
    return rejectWithValue(
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  }
});

// Delete lead
export const deleteLead = createAsyncThunk<string, string>(
  "leads/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/crm/leads/${id}`, {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      });

      const { success } = response.data;

      if (success) {
        return id;
      } else {
        return rejectWithValue("Failed to delete lead.");
      }
    } catch (error: any) {
      console.error("❌ deleteLead error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    }
  }
);

// Add note to lead
export const addLeadNote = createAsyncThunk<
  Lead,
  {
    id: string;
    noteData: {
      note: string;
      nextFollowUpAt?: string;
    };
  }
>("leads/addNote", async ({ id, noteData }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      `/crm/leads/${id}/notes`,
      noteData,
      {
        headers: {
          "x-tenant": getTenantFromURL(),
          "Content-Type": "application/json",
        },
      }
    );

    const { success, data: leadData } = response.data;

    if (success) {
      return leadData;
    } else {
      return rejectWithValue("Failed to add note to lead.");
    }
  } catch (error: any) {
    console.error("❌ addLeadNote error:", error);
    return rejectWithValue(
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  }
});

// Add notes to multiple leads
export const addMultipleLeadNotes = createAsyncThunk<
  { updatedLeads: Lead[] },
  {
    leadIds: string[];
    noteData: {
      note: string;
      nextFollowUpAt?: string;
    };
  }
>(
  "leads/addMultipleNotes",
  async ({ leadIds, noteData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        `/crm/leads/bulk-notes`,
        { leadIds, noteData },
        {
          headers: {
            "x-tenant": getTenantFromURL(),
            "Content-Type": "application/json",
          },
        }
      );

      const { success, data } = response.data;

      if (success) {
        return { updatedLeads: data };
      } else {
        return rejectWithValue("Failed to add notes to leads.");
      }
    } catch (error: any) {
      console.error("❌ addMultipleLeadNotes error:", error);
      return rejectWithValue(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    }
  }
);

export const assignLeads = createAsyncThunk<
  { updatedLeads: Lead[] },
  { leadIds: string[]; assignedTo: string } // assignedTo is now the staff ID
>("leads/assign", async ({ leadIds, assignedTo }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(
      "/crm/leads/assign",
      { leadIds, assignedTo }, // Send staff ID to backend
      {
        headers: {
          "x-tenant": getTenantFromURL(),
          "Content-Type": "application/json",
        },
      }
    );
    const { success, data } = response.data;
    if (success) {
      return { updatedLeads: data };
    } else {
      return rejectWithValue("Failed to assign leads.");
    }
  } catch (error: any) {
    console.error("❌ assignLeads error:", error);
    return rejectWithValue(
      error?.response?.data?.message || error?.message || "Something went wrong"
    );
  }
});

// Slice
const leadSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      if (action.payload.page !== undefined)
        state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined)
        state.pagination.limit = action.payload.limit;
    },
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {};
      state.searchQuery = "";
      state.pagination.page = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = Array.isArray(action.payload.leads)
          ? action.payload.leads
          : [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.leads)) {
          state.leads.unshift(action.payload);
        } else {
          state.leads = [action.payload];
        }
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.leads)) {
          const index = state.leads.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.leads[index] = action.payload;
          }
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteLead.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        if (Array.isArray(state.leads)) {
          state.leads = state.leads.filter((l) => l._id !== action.payload);
        }
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchLeadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.leads)) {
          const index = state.leads.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.leads[index] = action.payload;
          } else {
            state.leads.push(action.payload);
          }
        } else {
          state.leads = [action.payload];
        }
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add lead note cases
      .addCase(addLeadNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addLeadNote.fulfilled, (state, action) => {
        state.loading = false;
        // Update the lead in the leads array with the new note
        if (Array.isArray(state.leads)) {
          const index = state.leads.findIndex(
            (l) => l._id === action.payload._id
          );
          if (index !== -1) {
            state.leads[index] = action.payload;
          }
        }
      })
      .addCase(addLeadNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add multiple lead notes cases
      .addCase(addMultipleLeadNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMultipleLeadNotes.fulfilled, (state, action) => {
        state.loading = false;
        // Update multiple leads in the leads array with new notes
        if (Array.isArray(state.leads)) {
          const updatedLeadsArray = Array.isArray(action.payload.updatedLeads)
            ? action.payload.updatedLeads
            : [action.payload.updatedLeads];
          updatedLeadsArray.forEach((updatedLead) => {
            const index = state.leads.findIndex(
              (l) => l._id === updatedLead._id
            );
            if (index !== -1) {
              state.leads[index] = updatedLead;
            }
          });
        }
      })
      .addCase(addMultipleLeadNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(assignLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignLeads.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(state.leads)) {
          const updatedLeadsArray = Array.isArray(action.payload.updatedLeads)
            ? action.payload.updatedLeads
            : [action.payload.updatedLeads];
          updatedLeadsArray.forEach((updatedLead) => {
            const index = state.leads.findIndex(
              (l) => l._id === updatedLead._id
            );
            if (index !== -1) {
              state.leads[index] = updatedLead;
            } else {
              state.leads.push(updatedLead);
            }
          });
        } else {
          state.leads = Array.isArray(action.payload.updatedLeads)
            ? action.payload.updatedLeads
            : [action.payload.updatedLeads];
        }
      })
      .addCase(assignLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setPagination,
  setFilters,
  resetFilters,
  clearError,
} = leadSlice.actions;

export default leadSlice.reducer;
