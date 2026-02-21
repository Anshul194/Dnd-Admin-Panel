import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";
import { OrderDetails } from "../../types/order";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  total?: number;
  totalAmount: number;
  status:
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: string;
  updatedAt: string;
  shippingMethod?: string;
  deliveryOption?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface FetchOrderParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  paymentStatus?: string;
  isShipmentBooked?: boolean;
}

interface Pagination {
  total: number;
  totalDocuments?: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrderState {
  orders: Order[];
  currentOrder: OrderDetails | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  searchQuery: string;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
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

// Fetch paginated orders
export const fetchOrders = createAsyncThunk<
  { orders: Order[]; pagination: Pagination },
  FetchOrderParams
>("orders/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      status,
      paymentStatus,
      isShipmentBooked,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) {
      queryParams.append("search", search);
    }
    if (sortField)
      queryParams.append(
        "sortBy",
        JSON.stringify({ [sortField]: sortOrder === "asc" ? 1 : -1 })
      );
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    if (status) queryParams.append("status", status);
    if (typeof isShipmentBooked !== "undefined")
      queryParams.append("isShipmentBooked", String(Boolean(isShipmentBooked)));

    const filters: Record<string, any> = {};
    if (search) filters["_id"] = search;
    if (Object.keys(filters).length > 0) {
      queryParams.append("filters", JSON.stringify(filters));
    }
    if (paymentStatus) queryParams.append("paymentStatus", paymentStatus);

    const response = await axiosInstance.get(
      `/orders?${queryParams.toString()}`
    );
    console.log("Response from fetchOrders:", response.data);
    const data = response.data;

    // Handle nested structures similar to Role API
    const ordersData = data?.data || data?.body?.data || data?.body?.message?.data || [];

    // Calculate total numbers safely
    const totalDocs = data?.totalDocuments ?? data?.total ?? data?.body?.totalDocuments ?? 0;
    const totalPages = data?.totalPages ?? data?.body?.totalPages ?? 0;
    const currentPage = data?.currentPage ?? data?.page ?? data?.body?.currentPage ?? 1;

    // Filter out any null or undefined items from orders array to prevent frontend crashes
    const safeOrders = Array.isArray(ordersData) ? ordersData.filter((o: any) => o) : [];

    return {
      orders: safeOrders,
      pagination: {
        total: totalDocs,
        totalDocuments: totalDocs,
        page: currentPage,
        limit: limit,
        totalPages: totalPages,
      },
    };
  } catch (err: unknown) {
    const error = err as ApiError;
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Fetch order by ID
export const fetchOrderById = createAsyncThunk<OrderDetails, string>(
  "orders/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return response.data?.data || response.data?.body?.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update order
export const updateOrder = createAsyncThunk<
  Order,
  { id: string; data: Partial<Order> }
>("orders/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/orders/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data?.data;
  } catch (err: unknown) {
    const error = err as ApiError;
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Update order delivery option
export const updateOrderDelivery = createAsyncThunk<
  OrderDetails,
  { id: string;[key: string]: any }
>("orders/updateDelivery", async ({ id, ...updateData }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/orders/${id}`, updateData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data?.data || response.data?.body?.data;
  } catch (err: unknown) {
    const error = err as ApiError;
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Update payment status
export const updatePaymentStatus = createAsyncThunk<
  Order,
  { id: string; paymentStatus: Order["paymentStatus"] }
>(
  "orders/updatePaymentStatus",
  async ({ id, paymentStatus }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/orders/${id}/payment-status`,
        {
          paymentStatus,
        }
      );
      return response.data?.data;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk<string, string>(
  "orders/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/orders/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as ApiError;
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const orderSlice = createSlice({
  name: "orders",
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
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })

      .addCase(updateOrderDelivery.fulfilled, (state, action) => {
        if (state.currentOrder && action.payload && action.payload._id === state.currentOrder._id) {
          // Safely merge only top-level fields or provided fields to avoid blowing away populated data
          state.currentOrder = { ...state.currentOrder, ...action.payload };
        } else {
          state.currentOrder = action.payload;
        }
      })

      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })

      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o._id !== action.payload);
      });
  },
});

export const { setSearchQuery, setPagination, clearError, clearCurrentOrder } =
  orderSlice.actions;

export default orderSlice.reducer;
