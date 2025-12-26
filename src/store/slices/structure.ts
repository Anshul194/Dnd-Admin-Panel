/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface MetaIntegration {
  adAccountId?: string;
  pixelId?: string;
  pageId?: string;
  accessToken?: string;
  appId?: string;
  appSecret?: string;
  isConnected?: boolean;
  connectedAt?: string;
}

export interface Settings {
  codLimit: number;
  freeShippingThreshold: number;
  codShippingChargeBelowThreshold: number;
  prepaidShippingChargeBelowThreshold: number;
  repeatOrderRestrictionDays: number;
  codOtpRequired: boolean;
  codDisableForHighRTO: boolean;
  codBlockOnRTOAddress: boolean;
  highRTOOrderCount: number;
  metaIntegration?: MetaIntegration;
}

interface StructureState {
  settings: Partial<Settings>;
  loading: boolean;
  error: string | null;
}

const initialState: StructureState = {
  settings: {},
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk<Settings>(
  "structure/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/settings");
      console.log("settings", response.data);
      return response.data?.setting;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateSettings = createAsyncThunk<Settings, Partial<Settings>>(
  "structure/updateSettings",
  async (settings, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/settings", settings);
      // Extract the setting object from the response
      return response.data?.setting || response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const structureSlice = createSlice({
  name: "structure",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default structureSlice.reducer;
