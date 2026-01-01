import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// Interfaces
export interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  status: "published" | "draft";
  showInFooter: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FetchPagesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PageState {
  pages: Page[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
  filters: Record<string, any>;
}

const initialState: PageState = {
  pages: [],
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

// Async Thunks

// Create page
export const createPage = createAsyncThunk<Page, Partial<Page>>(
  "pages/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/page", data);
      // Handle different response structures
      const page =
        response.data?.data?.page ||
        response.data?.data ||
        response.data?.page ||
        response.data;

      // Ensure createdAt is set
      if (page && !page.createdAt) {
        page.createdAt = new Date().toISOString();
      }

      return page;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch all pages
export const fetchPages = createAsyncThunk<
  { pages: Page[]; pagination: Pagination },
  FetchPagesParams
>("pages/fetchAll", async (params = {}, { rejectWithValue }) => {
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
      queryParams.append("searchFields", JSON.stringify({ title: search }));
    if (sortField) queryParams.append("sortBy", sortField);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    if (filters) {
      queryParams.append("filters", JSON.stringify(filters));
    }
    const response = await axiosInstance.get(`/page?${queryParams.toString()}`);

    console.log("Fetch Pages Response:", response.data);
    const data = response.data.data;

    return {
      pages: data?.result || [],
      pagination: {
        total: data?.totalDocuments || 0,
        page: data?.page || 1,
        limit,
        totalPages: data?.totalPages || 0,
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Fetch page by ID
export const fetchPageById = createAsyncThunk<Page, string>(
  "pages/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/page/${id}`);
      //   console.log("Fetch Page by ID Response:", response.data);
      return response.data.body.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update page
export const updatePage = createAsyncThunk<
  Page,
  { id: string; data: Partial<Page> }
>("pages/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/page/${id}`, data);
    return response.data?.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Delete page
export const deletePage = createAsyncThunk<string, string>(
  "pages/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/page/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Slice
const pageSlice = createSlice({
  name: "pages",
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
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        // Sort pages by createdAt descending (newest first)
        const sortedPages = [...action.payload.pages].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA !== dateB) return dateB - dateA; // Newest first
          // Fallback to _id comparison
          return (b._id || '').localeCompare(a._id || '');
        });
        state.pages = sortedPages;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPage.fulfilled, (state, action) => {
        state.loading = false;
        // Only add if payload is valid and has required fields
        if (action.payload && action.payload._id) {
          // Check if page already exists (avoid duplicates)
          const exists = state.pages.some(p => p._id === action.payload._id);
          if (!exists) {
            // Add createdAt if not present
            const pageWithDate = {
              ...action.payload,
              createdAt: action.payload.createdAt || new Date().toISOString()
            };
            state.pages.unshift(pageWithDate);
            // Sort to ensure newest first
            state.pages.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
          }
        }
      })
      .addCase(createPage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      //   .addCase(updatePage.fulfilled, (state, action) => {
      //     const index = state.pages.findIndex(
      //       (p) => p._id === action.payload._id
      //     );
      //     if (index !== -1) {
      //       state.pages[index] = action.payload;
      //     }
      //   })
      .addCase(deletePage.fulfilled, (state, action) => {
        state.pages = state.pages.filter((p) => p._id !== action.payload);
      })
      .addCase(fetchPageById.fulfilled, (state, action) => {
        const index = state.pages.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.pages[index] = action.payload;
        } else {
          state.pages.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, setFilters, resetFilters, clearError } = pageSlice.actions;

export default pageSlice.reducer;
