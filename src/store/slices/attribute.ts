import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// Interfaces
interface Attribute {
  _id: string;
  name: string;
  description: string;
  values: string[];
  status: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slug: string;
  __v: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AttributeState {
  attributes: Attribute[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: Record<string, any>;
  searchQuery: string;
}

const initialState: AttributeState = {
  attributes: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  filters: {},
  searchQuery: "",
};

// Fetch attributes with pagination, filters, search
export const fetchAttributes = createAsyncThunk<
  {
    result: Attribute[];
    pagination: Pagination;
  },
  {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
    search?: string;
    sort?: Record<string, any>;
  }
>("attributes/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      filters = {},
      search = "",
      sort = {},
    } = params;
    // Build query params
    const query: any = {
      page,
      limit,
      filters: JSON.stringify(filters),
      selectFields: JSON.stringify({ name: search }),
      ...sort,
    };
    const response = await axiosInstance.get("/attribute", {
      headers: { "x-tenant": getTenantFromURL() },
      params: query,
    });
    const data = response.data?.data || {};
    return {
      result: data.result || [],
      pagination: {
        page: data.page || page,
        limit: data.limit || limit,
        total: data.total || (data.result ? data.result.length : 0),
        totalPages: data.totalPages || 1,
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Create attribute
export const createAttribute = createAsyncThunk<Attribute, Partial<Attribute>>(
  "attributes/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/attribute", data, {
        headers: { "x-tenant": getTenantFromURL() },
      });
      
      // Handle different response structures
      if (response.data.success === false) {
        return rejectWithValue(response.data.message || "Failed to create attribute");
      }
      
      // Return the data from response (could be response.data.data or response.data)
      return response.data.data || response.data;
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.body?.message || 
        err.response?.data?.message || 
        err.message || 
        "Failed to create attribute. Please try again.";
      return rejectWithValue(errorMessage);
    }
  }
);

// Update attribute
export const updateAttribute = createAsyncThunk<
  Attribute,
  { id: string; data: Partial<Attribute> }
>("attributes/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/attribute/${id}`, data, {
      headers: {
        "x-tenant": getTenantFromURL(),
        "Content-Type": "application/json",
      },
    });
    return response.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Delete attribute
export const deleteAttribute = createAsyncThunk<string, string>(
  "attributes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/attribute/${id}`, {
        headers: { "x-tenant": getTenantFromURL() },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const attributeSlice = createSlice({
  name: "attribute",
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFilters(state, action: PayloadAction<Record<string, any>>) {
      state.filters = action.payload;
    },
    resetFilters(state) {
      state.filters = {};
      state.searchQuery = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload.result;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(updateAttribute.fulfilled, (state, action) => {
      const idx = state.attributes.findIndex(
        (attr) => attr._id === action.payload._id
      );
      if (idx !== -1) {
        state.attributes[idx] = action.payload;
      }
    });
    builder.addCase(deleteAttribute.fulfilled, (state, action) => {
      state.attributes = state.attributes.filter(
        (attr) => attr._id !== action.payload
      );
    });
  },
});

export const { setSearchQuery, setFilters, resetFilters } =
  attributeSlice.actions;
export default attributeSlice.reducer;
