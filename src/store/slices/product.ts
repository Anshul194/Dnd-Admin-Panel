/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

// Interfaces
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as per your schema
}

interface FetchProductParams {
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

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

const initialState: ProductState = {
  products: [],
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

// Async thunk to fetch products with pagination
export const fetchProducts = createAsyncThunk<
  { products: Product[]; pagination: Pagination },
  FetchProductParams
>("products/fetchAll", async (params = {}, { rejectWithValue }) => {
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
    if (search) queryParams.append("searchFields", JSON.stringify(search));
    if (sortField) queryParams.append("sortBy", JSON.stringify(sortField));
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    if (filters) {
      queryParams.append("filters", JSON.stringify(filters));
    }
    const response = await axiosInstance.get(
      `/product?${queryParams.toString()}`
    );

    // FIX: Extract data properly
    const apiData = response.data?.products?.data;
    const productsArray = apiData?.products || [];
    const pag = apiData?.pagination || {};

    return {
      products: productsArray,
      pagination: {
        total: pag.totalItems || 0,
        page: pag.currentPage || 1,
        limit: pag.itemsPerPage || limit,
        totalPages: pag.totalPages || 0,
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Create product
export const createProduct = createAsyncThunk<Product, any>(
  "products/create",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/product", productData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data || {};
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Check if product has variants before deletion
export const checkProductVariants = createAsyncThunk<
  { hasVariants: boolean; variantCount: number },
  string
>("products/checkVariants", async (productId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/variant`, {
      params: {
        productId: productId,
        limit: 1000 // Get all variants for this product
      }
    });

    const variants = response.data?.data?.result || [];
    return {
      hasVariants: variants.length > 0,
      variantCount: variants.length
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

// Delete product
export const deleteProduct = createAsyncThunk<string, string>(
  "products/delete",
  async (productId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/product/${productId}`);
      return productId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProductById = createAsyncThunk<Product, string>(
  "products/fetchById",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/product/${productId}`);
      console?.log("dat fetc", response.data);
      return response.data?.product || {};
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk<
  Product,
  { id: string; data: any }
>("products/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/product/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data || {};
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.body?.message ||
      err.response?.data?.message ||
      err.message ||
      "Failed to update product"
    );
  }
});

// Slice
const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.loading = false;
      state.error = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      if (action.payload.page !== undefined)
        state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined)
        state.pagination.limit = action.payload.limit;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearProducts, setSearchQuery, setPagination } =
  productSlice.actions;
export default productSlice.reducer;
