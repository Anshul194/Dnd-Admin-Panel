import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// Interfaces
export interface Staff {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: string | null;
  tenant: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  __v?: number;
  // Optional legacy fields for backward compatibility
  phone?: string;
  position?: string;
  department?: string;
  status?: "active" | "inactive";
  tenantId?: string;
  updatedAt?: string;
}

interface FetchStaffParams {
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

interface StaffState {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

// Initial State
const initialState: StaffState = {
  staff: [],
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

// Fetch all staff
export const fetchStaff = createAsyncThunk<
  { staff: Staff[]; pagination: Pagination },
  FetchStaffParams
>("staff/fetchAll", async (params = {}, { rejectWithValue }) => {
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
    if (search)
      queryParams.append(
        "searchFields",
        JSON.stringify({
          name: search,
          email: search,
        })
      );

    const response = await axiosInstance.get(
      `/staff?${queryParams.toString()}`,
      {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      }
    );

    console.log("Staff Full response from API:", response.data);
    const data = response.data;

    return {
      staff: data?.users || [],
      pagination: {
        total: data?.total || 0,
        page: data?.page || page,
        limit: data?.limit || limit,
        totalPages: Math.ceil((data?.total || 0) / (data?.limit || limit)),
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Fetch staff by ID
export const fetchStaffById = createAsyncThunk<Staff, string>(
  "staff/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/staff?id=${id}`, {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create Staff
export const createStaff = createAsyncThunk<Staff, Partial<Staff>>(
  "staff/create",
  async (data, { rejectWithValue }) => {
    try {
      console.log("Creating staff with data:", data);
      const response = await axiosInstance.post("/staff", data, {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      });
      // Handle different response structures
      const staffData = 
        response.data?.data?.body?.staff ||
        response.data?.data?.body?.data ||
        response.data?.data?.staff ||
        response.data?.data ||
        response.data?.body ||
        response.data;
      return staffData;
    } catch (err: any) {
      console.error("Create staff error:", {
        error: err,
        response: err.response?.data,
        message: err.message,
        status: err.response?.status
      });
      const errorMessage = 
        err.response?.data?.body?.message ||
        err.response?.data?.message || 
        err.message || 
        "Failed to create staff member";
      return rejectWithValue(errorMessage);
    }
  }
);

// Update Staff
export const updateStaff = createAsyncThunk<
  Staff,
  { id: string; data: Partial<Staff> }
>("staff/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/staff?id=${id}`, data, {
      headers: {
        "x-tenant": getTenantFromURL(),
      },
    });
    return response.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Delete Staff
export const deleteStaff = createAsyncThunk<string, string>(
  "staff/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/staff?id=${id}`, {
        headers: {
          "x-tenant": getTenantFromURL(),
        },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Slice
const staffSlice = createSlice({
  name: "staff",
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
    clearStaffError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload.staff;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff.unshift(action.payload);
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        const index = state.staff.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) state.staff[index] = action.payload;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.staff = state.staff.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        const index = state.staff.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.staff[index] = action.payload;
        } else {
          state.staff.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, clearStaffError } =
  staffSlice.actions;

export default staffSlice.reducer;
