/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  allowPrepaidOnly?: boolean; // Added
  disableCOD?: boolean;       // Added
}

interface FetchCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  // optional arbitrary filters that will be appended as query params
  filters?: Record<string, string | number | boolean>;
}

interface Pagination {
  total: number;
  totalDocuments?: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
  filters: Record<string, any>;
}

const initialState: CategoryState = {
  categories: [],
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

// Create category
export const createCategory = createAsyncThunk<Category, Partial<Category>>(
  "categories/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("category", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data?.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.body?.message ||
        err.response?.data?.message ||
        err.message
      );
    }
  }
);

// Fetch paginated categories
export const fetchCategories = createAsyncThunk<
  { categories: Category[]; pagination: Pagination },
  FetchCategoryParams
>("categories/fetchAll", async (params = {}, { rejectWithValue }) => {
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
    if (search) {
      queryParams.append("searchFields", JSON.stringify({ name: search }));
    }
    if (sortField) queryParams.append("sortBy", sortField);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);
    if (filters) {
      queryParams.append("filters", JSON.stringify(filters));
    }

    const response = await axiosInstance.get(
      `/category?${queryParams.toString()}`
    );

    // Backend response structure can be:
    // Case 1: { success: true, message: "...", data: { result: [...], currentPage, totalPages, totalDocuments } }
    // Case 2: { success: true, message: "...", data: { status: 200, body: { success: true, message: "...", data: { result: [...], ... } } } }
    
    // Try to extract the actual data object
    let data = response.data?.data;
    
    // Handle nested structure: data might be { status: 200, body: { success: true, message: "...", data: {...} } }
    if (data?.body?.data) {
      // Nested structure: extract from body.data
      data = data.body.data;
    } else if (data?.data && data?.data?.result) {
      // Another nested level
      data = data.data;
    }

    // Extract categories array - the repository returns { result: [...], currentPage, totalPages, totalDocuments }
    const categoriesArray: Category[] = Array.isArray(data?.result) ? data.result : [];

    return {
      categories: categoriesArray,
      pagination: {
        total: data?.totalDocuments ?? data?.total ?? categoriesArray.length,
        totalDocuments: data?.totalDocuments ?? categoriesArray.length,
        page: data?.currentPage ?? data?.page ?? 1,
        limit: limit,
        totalPages: data?.totalPages ?? Math.ceil((data?.totalDocuments ?? data?.total ?? categoriesArray.length) / limit),
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.body?.message || err.response?.data?.message || err.message);
  }
});

// Fetch category by ID
export const fetchCategoryById = createAsyncThunk<Category, string>(
  "categories/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/category/${id}`);
      return response.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk<
  Category,
  { id: string; data: Partial<Category> }
>(
  "categories/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/category/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk<string, string>(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/category/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Slice
const categorySlice = createSlice({
  name: "categories",
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
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        
        // Ensure categories is an array
        const categoriesArray = Array.isArray(action.payload.categories) 
          ? action.payload.categories 
          : [];
        
        // Sort categories by createdAt in descending order (newest first)
        const sortedCategories = categoriesArray.length > 0
          ? [...categoriesArray].sort((a, b) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA; // Descending order (newest first)
            })
          : [];
        
        state.categories = sortedCategories;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.unshift(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload
        );
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        const index = state.categories.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        } else {
          state.categories.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, setFilters, resetFilters, clearError } =
  categorySlice.actions;

export default categorySlice.reducer;
