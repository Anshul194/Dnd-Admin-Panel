/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface Tenant {
  _id: string;
  tenantId: string;
  companyName: string;
  subdomain: string;
  dbUri?: string;
  status: "active" | "inactive";
  plan: "free" | "basic" | "pro" | "enterprise";
  subscriptionStatus: "trial" | "active" | "cancelled" | "expired";
  trialEndsAt?: string;
  renewalDate?: string;
  lastAccessedAt?: string;
  notes?: string;
  isDeleted: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

interface FetchTenantParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

const initialState: TenantState = {
  tenants: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  searchQuery: "",
};

// Create Tenant
export const createTenant = createAsyncThunk<Tenant, Partial<Tenant>>(
  "tenants/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/tenant", data);

      // Handle nested structures
      const responseData = response.data?.data?.body?.data ||
        response.data?.body?.data ||
        response.data?.data ||
        response.data;

      return responseData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch all tenants
export const fetchTenants = createAsyncThunk<
  { tenants: Tenant[]; pagination: Pagination },
  FetchTenantParams
>("tenants/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortField = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) queryParams.append("searchFields", JSON.stringify(search));
    if (Object.keys(filters).length > 0) {
      queryParams.append("filters", JSON.stringify(filters));
    }
    queryParams.append("sortBy", sortField);
    queryParams.append("sortOrder", sortOrder);

    const response = await axiosInstance.get(
      `/tenant?${queryParams.toString()}`
    );

    // Handle highly nested response structures from the backend
    // Common pattern: response.data.data.body.data
    const apiData = response.data?.data?.body?.data ||
      response.data?.body?.data ||
      response.data?.data ||
      response.data;

    let tenants: Tenant[] = [];

    if (apiData) {
      tenants = (apiData.result || apiData.tenants || apiData.data || (Array.isArray(apiData) ? apiData : [])) as Tenant[];
    }

    const paginationData = {
      total: apiData?.totalDocuments || apiData?.total || tenants.length || 0,
      page: apiData?.currentPage || apiData?.page || page,
      limit: apiData?.limit || limit,
      totalPages: apiData?.totalPages || 0,
    };

    // Debug logging (only in development)
    if (import.meta.env.DEV) {
      console.log("Tenants API Response extracted:", {
        tenants,
        pagination: paginationData
      });
    }

    return {
      tenants: tenants,
      pagination: {
        total: paginationData.total,
        page: paginationData.page,
        limit: paginationData.limit,
        totalPages: paginationData.totalPages,
      },
    };
  } catch (err: any) {
    // Log error details for debugging
    if (import.meta.env.DEV) {
      const queryParamsForError = new URLSearchParams();
      queryParamsForError.append("page", (params.page || 1).toString());
      queryParamsForError.append("limit", (params.limit || 10).toString());
      if (params.search) queryParamsForError.append("searchFields", JSON.stringify(params.search));
      if (params.sortField) queryParamsForError.append("sortBy", params.sortField);
      if (params.sortOrder) queryParamsForError.append("sortOrder", params.sortOrder);

      console.error("Error fetching tenants:", {
        error: err,
        response: err.response?.data,
        message: err.message,
        status: err.response?.status,
        url: `/tenant?${queryParamsForError.toString()}`
      });
    }
    return rejectWithValue(
      err.response?.data?.body?.message ||
      err.response?.data?.message ||
      err.message ||
      "Failed to fetch tenants"
    );
  }
});

// Fetch by ID
export const fetchTenantById = createAsyncThunk<Tenant, string>(
  "tenants/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/tenant?id=${id}`);

      // Handle nested structures
      const responseData = response.data?.data?.body?.data ||
        response.data?.body?.data ||
        response.data?.data ||
        response.data;

      return responseData;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update
export const updateTenant = createAsyncThunk<
  Tenant,
  { id: string; data: Partial<Tenant> }
>("tenants/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/tenant?id=${id}`, data);
    return response.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Delete
export const deleteTenant = createAsyncThunk<string, string>(
  "tenants/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/tenant?id=${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Slice
const tenantSlice = createSlice({
  name: "tenants",
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
    clearTenantError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = action.payload.tenants;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(createTenant.fulfilled, (state, action) => {
        state.tenants.unshift(action.payload);
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        const index = state.tenants.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.tenants = state.tenants.filter((t) => t._id !== action.payload);
      })
      .addCase(fetchTenantById.fulfilled, (state, action) => {
        const index = state.tenants.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tenants[index] = action.payload;
        } else {
          state.tenants.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, clearTenantError } =
  tenantSlice.actions;

export default tenantSlice.reducer;
