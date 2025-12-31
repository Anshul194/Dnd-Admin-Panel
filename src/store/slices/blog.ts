import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// Interfaces
interface Image {
  url: string;
  alt?: string;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  author: string;
  images: Image[];
  thumbnail?: Image;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FetchBlogParams {
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

interface BlogState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

const initialState: BlogState = {
  blogs: [],
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

// Create blog
export const createBlog = createAsyncThunk<Blog, Partial<Blog>>(
  "blogs/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/blog", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Handle different response structures
      const blogData = 
        response.data?.data?.body?.blog ||
        response.data?.data?.body?.data ||
        response.data?.data?.blog ||
        response.data?.data ||
        response.data?.blog ||
        response.data?.body ||
        response.data;
      return blogData;
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.body?.message ||
        err.response?.data?.message || 
        err.message || 
        "Failed to create blog";
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch blogs
export const fetchBlogs = createAsyncThunk<
  { blogs: Blog[]; pagination: Pagination },
  FetchBlogParams
>("blogs/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) queryParams.append("search", search);
    if (sortField) queryParams.append("sortBy", sortField);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    const response = await axiosInstance.get(`/blog?${queryParams.toString()}`);
    const data = response.data;
    console.log("Fetched Blogs:", data);
    return {
      blogs: data?.data || [],
      pagination: {
        total: data?.totalDocuments || 0,
        page: data?.page || page || 1,
        limit,
        totalPages: data?.totalPages || 0,
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Fetch blog by ID
export const fetchBlogById = createAsyncThunk<Blog, string>(
  "blogs/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Blog id is required");
      }
      
      // Try both path parameter and query parameter formats
      let response;
      try {
        // First try path parameter format: /blog/{id}
        response = await axiosInstance.get(`/blog/${id}`);
      } catch (pathErr: any) {
        // If that fails, try query parameter format: /blog?id={id}
        if (pathErr.response?.status === 400 || pathErr.response?.status === 404) {
          response = await axiosInstance.get(`/blog?id=${id}`);
        } else {
          throw pathErr;
        }
      }
      
      // Handle different response structures (for production vs development)
      const data = 
        response.data?.data?.body?.blog ||
        response.data?.data?.body?.data ||
        response.data?.data?.blog ||
        response.data?.data ||
        response.data?.body?.blog ||
        response.data?.body?.data ||
        response.data?.blog ||
        response.data?.body ||
        response.data;
      
      if (!data) {
        console.warn("Unexpected blog response structure:", response.data);
        return rejectWithValue("Invalid response from server");
      }
      
      return data;
    } catch (err: any) {
      console.error("Error fetching blog by ID:", {
        blogId: id,
        error: err,
        response: err.response?.data,
        message: err.message,
        status: err.response?.status
      });
      return rejectWithValue(
        err.response?.data?.body?.message ||
        err.response?.data?.message || 
        err.message || 
        "Failed to fetch blog"
      );
    }
  }
);

// Update blog
export const updateBlog = createAsyncThunk<
  Blog,
  { id: string; data: Partial<Blog> }
>("blogs/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/blog/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // Handle different response structures
    const blogData = 
      response.data?.data?.body?.blog ||
      response.data?.data?.body?.data ||
      response.data?.data?.blog ||
      response.data?.data ||
      response.data?.blog ||
      response.data?.body ||
      response.data;
    return blogData;
  } catch (err: any) {
    console.error("Update blog error:", {
      error: err,
      response: err.response?.data,
      message: err.message
    });
    const errorMessage = 
      err.response?.data?.body?.message ||
      err.response?.data?.message || 
      err.message || 
      "Failed to update blog";
    return rejectWithValue(errorMessage);
  }
});

// Delete blog
export const deleteBlog = createAsyncThunk<string, string>(
  "blogs/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/blog/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Slice
const blogSlice = createSlice({
  name: "blogs",
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
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.blogs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.blogs.unshift(action.payload);
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        const index = state.blogs.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.blogs[index] = action.payload;
        }
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter((b) => b._id !== action.payload);
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        const index = state.blogs.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.blogs[index] = action.payload;
        } else {
          state.blogs.push(action.payload);
        }
      });
  },
});

export const { setSearchQuery, setPagination, clearError } = blogSlice.actions;

export default blogSlice.reducer;
