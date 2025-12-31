/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface Coupon {
  _id?: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  minCartValue: number;
  // allow extra fields returned by backend
  [key: string]: any;
}

interface CouponState {
  loading: boolean;
  error: string | null;
  coupons: Coupon[];
  selectedCoupon: Coupon | null;
}

const initialState: CouponState = {
  loading: false,
  error: null,
  coupons: [],
  selectedCoupon: null,
};

export const createCoupon = createAsyncThunk<
  Coupon,
  Coupon,
  { rejectValue: string }
>("coupon/createCoupon", async (couponData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/coupon", couponData);
    // Handle different response structures
    const data = 
      response.data?.data?.coupon || 
      response.data?.data || 
      response.data?.coupon || 
      response.data;
    
    if (!data || !data._id) {
      console.warn("Unexpected coupon response structure:", response.data);
    }
    
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to create coupon"
    );
  }
});

export const fetchCoupons = createAsyncThunk<
  Coupon[],
  void,
  { rejectValue: string }
>("coupon/fetchCoupons", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/coupon");
    // support different response shapes
    let coupons = 
      response.data?.data?.coupons ||
      response.data?.data?.result ||
      response.data?.data ||
      response.data?.coupons?.data ||
      response.data?.coupons ||
      response.data?.result ||
      response.data ||
      [];
    
    // Ensure it's an array
    if (!Array.isArray(coupons)) {
      console.warn("Expected array but got:", typeof coupons, coupons);
      coupons = [];
    }
    
    return coupons;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch coupons"
    );
  }
});

export const deleteCoupon = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>("coupon/deleteCoupon", async (couponId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/coupon/${couponId}`);
    return { id: couponId };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to delete coupon"
    );
  }
});

export const getCouponById = createAsyncThunk<
  Coupon,
  string,
  { rejectValue: string }
>("coupon/getCouponById", async (couponId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/coupon/${couponId}`);
    return response.data?.coupon || response.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch coupon"
    );
  }
});

export const updateCoupon = createAsyncThunk<
  Coupon,
  { id: string; data: Partial<Coupon> },
  { rejectValue: string }
>("coupon/updateCoupon", async ({ id, data }, { rejectWithValue }) => {
  try {
    // Use PATCH for updating coupon
    const response = await axiosInstance.patch(`/coupon/${id}`, data);
    
    // Handle different response structures
    const result = 
      response.data?.data?.coupon ||
      response.data?.data ||
      response.data?.coupon ||
      response.data;
    
    return result;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.body?.message || err.response?.data?.message || err.message || "Failed to update coupon"
    );
  }
});

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        // Only add if payload is valid and has required fields
        if (action.payload && action.payload._id) {
          // Check if coupon already exists (avoid duplicates)
          const exists = state.coupons.some(c => c._id === action.payload._id);
          if (!exists) {
            console.log("Adding new coupon to state:", action.payload);
            // Add createdAt if not present
            const couponWithDate = {
              ...action.payload,
              createdAt: action.payload.createdAt || new Date().toISOString()
            };
            state.coupons.unshift(couponWithDate);
            // Sort to ensure newest first
            state.coupons.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
          } else {
            console.log("Coupon already exists in state:", action.payload._id);
          }
        } else {
          console.warn("Created coupon missing _id:", action.payload);
        }
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        // Merge fetched coupons with existing ones to preserve newly created coupons
        // that might not be in the backend response yet
        const fetchedIds = new Set(action.payload.map(c => c._id));
        const existingNotInFetched = state.coupons.filter(c => c._id && !fetchedIds.has(c._id));
        
        // Combine and deduplicate
        const mergedCoupons = [...action.payload, ...existingNotInFetched];
        const uniqueCoupons = mergedCoupons.reduce((acc, coupon) => {
          if (coupon._id && !acc.find(c => c._id === coupon._id)) {
            acc.push(coupon);
          }
          return acc;
        }, [] as Coupon[]);
        
        // Sort by createdAt descending (newest first), fallback to _id if no createdAt
        const sortedCoupons = uniqueCoupons.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA !== dateB) return dateB - dateA; // Newest first
          // If no dates, sort by _id (newer IDs typically come later)
          return (b._id || '').localeCompare(a._id || '');
        });
        
        state.coupons = sortedCoupons;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((c) => c._id !== action.payload.id);
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const idx = state.coupons.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1)
          state.coupons[idx] = { ...state.coupons[idx], ...action.payload };
      })
      .addCase(getCouponById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
        state.selectedCoupon = null;
      });
  },
});

export default couponSlice.reducer;
