import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// Variant interfaces
interface Attribute {
  attributeId: string;
  value: string;
  _id: string;
}

interface Variant {
  isDefault?: boolean;
  _id: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  attributes: Attribute[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface AttributeDropdown {
  _id: string;
  attributeId: string;
  value: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface VariantState {
  variants: Variant[];
  products: Array<{ _id: string; name: string }>;
  attributes: AttributeDropdown[];
  attributesPagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: VariantState = {
  variants: [],
  products: [],
  attributes: [],
  attributesPagination: null,
  loading: false,
  error: null,
};

// Fetch variants
export const fetchVariants = createAsyncThunk<
  Variant[],
  { tenant: string; productId?: string }
>("variants/fetchAll", async ({ tenant, productId }, { rejectWithValue }) => {
  try {
    const params: any = {};
    if (productId) {
      params.filters = JSON.stringify({ productId });
    }

    const response = await axiosInstance.get("/variant", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-tenant": getTenantFromURL(),
      },
      params,
    });
    // console.log("Fetched variants response:", response.data);
    return response.data?.data?.result || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Fetch attributes with pagination, filters, search, and sort

// Delete attribute
export const deleteAttribute = createAsyncThunk<
  string,
  { attributeId: string; tenant: string }
>("attributes/delete", async ({ attributeId, tenant }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/variant/${attributeId}`, {
      headers: { "x-tenant": getTenantFromURL() },
      data: "", // Send empty body as per curl
    });
    // Return deleted attributeId for reducer
    return attributeId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});
export const fetchAttributes = createAsyncThunk<
  {
    result: AttributeDropdown[];
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
    const query: any = {
      page,
      limit,
      ...filters,
      search,
      ...sort,
    };
    const response = await axiosInstance.get("/attribute", {
      headers: { "x-tenant": getTenantFromURL() },
      params: query,
    });
    // console.log("Fetched attributes response:", response.data);
    const data = response.data?.data || {};
    // Map API result to dropdown format
    const result = Array.isArray(data.result)
      ? data.result.map((attr: any) => ({
        _id: attr._id,
        attributeId: attr._id,
        value: attr.name,
      }))
      : [];
    return {
      result,
      pagination: {
        page: data.currentPage || page,
        limit: data.result?.length || limit,
        total: data.totalDocuments || (data.result ? data.result.length : 0),
        totalPages: data.totalPages || 1,
      },
    };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchProducts = createAsyncThunk<
  Array<{ _id: string; name: string }>,
  { tenant: string }
>("products/fetchAll", async ({ tenant }, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append("limit", "500");

    const response = await axiosInstance.get(
      `/product?${queryParams.toString()}`
    );
    // console.log("Fetched products response:", response.data);

    // Correct extraction of products array
    const productsArray =
      response.data?.products?.data?.products ||
      response.data?.products?.data?.result ||
      response.data?.products?.data ||
      [];
    return productsArray;
  } catch (err: any) {
    // console.log("Error fetching products:", err);
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createVariant = createAsyncThunk<
  any,
  {
    tenant: string;
    productId: string;
    title: string;
    sku: string;
    price: number;
    salePrice?: number;
    stock: number;
    offerTag?: string;
    images?: File[];
    attributes: Array<{ attributeId: string; value: string }>;
  }
>("variants/create", async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("productId", payload.productId);
    formData.append("title", payload.title);
    formData.append("sku", payload.sku);
    formData.append("price", String(payload.price));
    if (payload.salePrice)
      formData.append("salePrice", String(payload.salePrice));
    formData.append("stock", String(payload.stock));
    if (payload.offerTag) formData.append("offerTag", payload.offerTag);
    if (payload.images) {
      payload.images.forEach((img, idx) => {
        formData.append(`images[${idx}]`, img);
      });
    }
    // Filter out empty attributes and only send valid ones
    const validAttributes = payload.attributes.filter(
      (attr) =>
        attr &&
        attr.attributeId &&
        attr.value &&
        typeof attr.attributeId === 'string' &&
        typeof attr.value === 'string' &&
        attr.attributeId.trim() !== '' &&
        attr.value.trim() !== ''
    );

    // Ensure at least one valid attribute
    if (validAttributes.length === 0) {
      return rejectWithValue('At least one valid attribute is required');
    }

    validAttributes.forEach((attr, idx) => {
      formData.append(`attributes[${idx}][attributeId]`, attr.attributeId.trim());
      formData.append(`attributes[${idx}][value]`, attr.value.trim());
    });

    const response = await axiosInstance.post("/variant", formData, {
      headers: {
        "x-tenant": getTenantFromURL(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data;
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create variant';
    console.error('Variant creation error:', {
      message: errorMessage,
      response: err?.response?.data,
      status: err?.response?.status
    });
    return rejectWithValue(errorMessage);
  }
});

// Updated updateVariant to handle existing images properly
export const updateVariant = createAsyncThunk<
  any,
  {
    tenant: string;
    variantId: string;
    productId: string;
    title: string;
    sku: string;
    price: number;
    salePrice?: number;
    stock: number;
    offerTag?: string;
    images?: File[];
    existingImages?: string[];
    attributes: Array<{ attributeId: string; value: string }>;
  }
>("variants/update", async (payload, { rejectWithValue }) => {
  try {
    // console.log("🟡 [updateVariant] Payload received:", payload);

    const formData = new FormData();

    // Basic fields
    formData.append("productId", payload.productId);
    formData.append("title", payload.title);
    formData.append("sku", payload.sku);
    formData.append("price", String(payload.price));
    if (payload.salePrice !== undefined)
      formData.append("salePrice", String(payload.salePrice));
    formData.append("stock", String(payload.stock));
    if (payload.offerTag) formData.append("offerTag", payload.offerTag);

    // Existing images
    if (payload.existingImages?.length) {
      payload.existingImages.forEach((img, idx) => {
        formData.append(`existingImages[${idx}]`, img);
      });
      // console.log(
      //   "📸 [updateVariant] Included existingImages:",
      //   payload.existingImages
      // );
    }

    // New images
    if (payload.images?.length) {
      payload.images.forEach((img, idx) => {
        formData.append(`newImages[${idx}]`, img);
      });
      // console.log(
      //   "🖼️ [updateVariant] Included newImages:",
      //   payload.images.map((f) => f.name)
      // );
    }

    // Attributes
    if (payload.attributes?.length) {
      payload.attributes.forEach((attr, idx) => {
        formData.append(`attributes[${idx}][attributeId]`, attr.attributeId);
        formData.append(`attributes[${idx}][value]`, attr.value);
      });
      // console.log(
      //   "🧬 [updateVariant] Attributes included:",
      //   payload.attributes
      // );
    }

    // Log FormData content (for dev/debug only)
    // console.log("📦 [updateVariant] FormData content:");
    for (let [key, value] of formData.entries()) {
      // console.log(` - ${key}:`, value);
    }

    const response = await axiosInstance.put(
      `/variant/${payload.variantId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-tenant": getTenantFromURL(),
        },
      }
    );

    // console.log("✅ [updateVariant] Update successful:", response.data?.data);
    return response.data?.data;
  } catch (err: any) {
    // console.error(
    //   "❌ [updateVariant] Error:",
    //     err.response?.data || err.message
    // );
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const variantSlice = createSlice({
  name: "variants",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch variants
      .addCase(fetchVariants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVariants.fulfilled, (state, action) => {
        state.loading = false;
        state.variants = action.payload;
      })
      .addCase(fetchVariants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch attributes
      .addCase(fetchAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAttributes.fulfilled,
        (
          state,
          action: PayloadAction<{
            result: AttributeDropdown[];
            pagination: Pagination;
          }>
        ) => {
          state.loading = false;
          state.attributes = action.payload.result;
          state.attributesPagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchAttributes.rejected,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      )

      // Delete attribute
      .addCase(deleteAttribute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAttribute.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted attribute from state.attributes
        state.attributes = state.attributes.filter(
          (attr) => attr._id !== action.payload
        );
        // Remove deleted variant from state.variants
        state.variants = state.variants.filter(
          (variant) => variant._id !== action.payload
        );
      })
      .addCase(deleteAttribute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create variant
      .addCase(createVariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.variants.push(action.payload);
        }
      })
      .addCase(createVariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update variant
      .addCase(updateVariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        state.loading = false;
        // The thunk returns response.data.data which IS the variant object
        const updatedVariant = action.payload;
        if (updatedVariant && updatedVariant._id) {
          const index = state.variants.findIndex(
            (v) => v._id === updatedVariant._id
          );
          if (index !== -1) {
            state.variants[index] = updatedVariant;
          }
        }
      })
      .addCase(updateVariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading } = variantSlice.actions;
export default variantSlice.reducer;
