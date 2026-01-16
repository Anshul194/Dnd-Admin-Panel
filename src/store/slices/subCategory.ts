/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// Interfaces
export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status?: string;
  parentCategory: string | { _id: string; name?: string };
  image?: string | File;
  thumbnail?: string | File;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subCategoryCount?: number;
}

interface FetchSubcategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | null>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SubcategoryState {
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

const initialState: SubcategoryState = {
  subcategories: [],
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

// Create subcategory
export const createSubcategory = createAsyncThunk<
  Subcategory,
  Partial<Subcategory>
>("subcategories/create", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("subcategory", data, {
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
});

// Fetch all subcategories with pagination
export const fetchSubcategories = createAsyncThunk<
  { subcategories: Subcategory[]; pagination: Pagination },
  FetchSubcategoryParams
>("subcategories/fetchAll", async (params = {}, { rejectWithValue }) => {
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
    if (search)
      queryParams.append("searchFields", JSON.stringify({ name: search }));
    if (sortField) queryParams.append("sortBy", sortField);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);
    if (filters) {
      queryParams.append("filters", JSON.stringify(filters));
    }
    const response = await axiosInstance.get(
      `/subcategory?${queryParams.toString()}`
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

    // Extract subcategories array - the repository returns { result: [...], currentPage, totalPages, totalDocuments }
    const subcategoriesArray: Subcategory[] = Array.isArray(data?.result) ? data.result : [];

    return {
      subcategories: subcategoriesArray,
      pagination: {
        total: data?.totalDocuments ?? data?.total ?? subcategoriesArray.length,
        totalDocuments: data?.totalDocuments ?? subcategoriesArray.length,
        page: data?.currentPage ?? data?.page ?? 1,
        limit,
        totalPages: data?.totalPages ?? Math.ceil((data?.totalDocuments ?? data?.total ?? subcategoriesArray.length) / limit),
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Fetch subcategory by ID
export const fetchSubcategoryById = createAsyncThunk<Subcategory, string>(
  "subcategories/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/subcategory/${id}`);
      console.log("Fetched subcategory by ID:", response.data);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.body?.message || err.response?.data?.message || err.message);
    }
  }
);

// Update subcategory
export const updateSubcategory = createAsyncThunk<
  Subcategory,
  { id: string; data: Partial<Subcategory> }
>("subcategories/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/subcategory/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.body?.message || err.response?.data?.message || err.message);
  }
});

// Delete subcategory
export const deleteSubcategory = createAsyncThunk<string, string>(
  "subcategories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/subcategory/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const getSubcategoriesByCategory = createAsyncThunk<
  Subcategory[],
  string
>("subcategories/getByCategory", async (categoryId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      `/subcategory/category/${categoryId}`
    );
    return response.data?.data || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Slice
const subcategorySlice = createSlice({
  name: "subcategories",
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
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.loading = false;
        
        // Ensure subcategories is an array
        const subcategoriesArray = Array.isArray(action.payload.subcategories) 
          ? action.payload.subcategories 
          : [];
        
        // Sort subcategories by createdAt in descending order (newest first)
        const sortedSubcategories = subcategoriesArray.length > 0
          ? [...subcategoriesArray].sort((a, b) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA; // Descending order (newest first)
            })
          : [];
        
        state.subcategories = sortedSubcategories;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.subcategories.unshift(action.payload);
      })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        const index = state.subcategories.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.subcategories[index] = action.payload;
        }
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.subcategories = state.subcategories.filter(
          (s) => s._id !== action.payload
        );
      })
      .addCase(fetchSubcategoryById.fulfilled, (state, action) => {
        const index = state.subcategories.findIndex(
          (s) => s._id === action.payload._id
        );
        if (index !== -1) {
          state.subcategories[index] = action.payload;
        } else {
          state.subcategories.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, clearError } =
  subcategorySlice.actions;

export default subcategorySlice.reducer;
