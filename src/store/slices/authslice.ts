import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "../../services/axiosConfig";
import type {
  User,
  SignupData,
  AuthResponse,
  AuthState,
  ApiResponse,
  ProfileUpdateData,
  PasswordResetData,
} from "../../types/auth";
import { getTenantFromURL } from "../../utils/getTenantFromURL";

// API base URL

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

// Helper function to handle API errors

const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "Network error";
  }
  return error instanceof Error ? error.message : "Unknown error";
};

// Async thunks for API calls

// login api call

export const login = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    // Use relative path since axiosInstance already has baseURL configured
    const response = await axiosInstance.patch<AuthResponse>(
      "/api/user",
      {
        email: credentials.email,
        password: credentials.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-tenant": getTenantFromURL(),
        },
      }
    );

    console.log("🔐 Login response:", response.data);

    const data = response.data;

    // Logging token & user
    if (data.accessToken) {
      console.log("✅ AccessToken:", data.accessToken);
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);
    }

    if (data.refreshToken) {
      console.log("♻️ RefreshToken:", data.refreshToken);
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    if (data.user) {
      console.log("👤 Logged in User:", data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    // Return all required fields for state update
    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error: any) {
    console.error("❌ Login error:", error.message);
    return rejectWithValue(handleApiError(error));
  }
});

// signup api call

export const signup = createAsyncThunk<
  AuthResponse,
  SignupData,
  { rejectValue: string }
>("auth/signup", async (userData, { rejectWithValue }) => {
  try {
    console.log("Trying to sign up with data:", userData);
    console.log("API Base URL:", API_BASE_URL);
    const response = await axios.post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}/signup`,
      {
        email: userData.email,
        password: userData.password,

        fullName: userData.fullName,
        role: userData.role || "admin",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-tenant": getTenantFromURL(),
        },
      }
    );
    console.log("Signup response:", response);

    const data = response.data;

    console.log("Signup data:", data);

    if (data.data?.accessToken) {
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    if (data.data?.refreshToken) {
      localStorage.setItem("refreshToken", data.data.refreshToken);
    }
    if (data.data?.user) {
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    return {
      user: data.data.user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  } catch (error: any) {
    console.log("tring signup", error.message);
    return rejectWithValue(handleApiError(error));
  }
});

// Logout API call

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (token) {
        await fetch(`${API_BASE_URL}api/v1/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant": getTenantFromURL(),
          },
          credentials: "include",
        });
      }

      // Clear all tokens
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/signin";
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }
);

// Check authentication status API call

export const checkAuthStatus = createAsyncThunk<
  { user: User; token: string },
  void,
  { rejectValue: string }
>("auth/checkStatus", async (_, { rejectWithValue }) => {
  try {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      return rejectWithValue("No token found");
    }

    // If we have stored user data, return it first for faster loading
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);

        // Verify with server
        const response = await axiosInstance.get<ApiResponse<{ user: User }>>(
          `${API_BASE_URL}api/v1/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const data = response.data;
          return { user: data.data?.user || user, token };
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return rejectWithValue("Token validation failed");
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return rejectWithValue(
            error.response.data?.message || "Token validation failed"
          );
        }
        console.warn("Error parsing stored user data or network error:", error);
      }
    }

    // Fallback to server verification
    try {
      const response = await axios.get<ApiResponse<{ user: User }>>(
        `${API_BASE_URL}api/v1/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const data = response.data;
      return { user: data.data?.user!, token };
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      return rejectWithValue(handleApiError(error));
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return rejectWithValue(handleApiError(error));
  }
});

export const updateProfile = createAsyncThunk<
  { user: User },
  ProfileUpdateData,
  { rejectValue: string }
>("auth/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Profile update failed");
    }

    return data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const forgotPassword = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>("auth/forgotPassword", async (email, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Failed to send reset email");
    }

    return data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const resetPassword = createAsyncThunk<
  { message: string },
  PasswordResetData,
  { rejectValue: string }
>("auth/resetPassword", async ({ token, password }, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || "Password reset failed");
    }

    return data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// Helper function to safely parse user from localStorage
const parseStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

// Initial state
const initialState: AuthState = {
  user: parseStoredUser(),
  token: localStorage.getItem("accessToken") || localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: !!(
    localStorage.getItem("accessToken") || localStorage.getItem("token")
  ),
  status: "idle",
  error: null,
  loginStatus: "idle",
  signupStatus: "idle",
  logoutStatus: "idle",
  profileUpdateStatus: "idle",
  passwordResetStatus: "idle",
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearStatuses: (state) => {
      state.loginStatus = "idle";
      state.signupStatus = "idle";
      state.logoutStatus = "idle";
      state.profileUpdateStatus = "idle";
      state.passwordResetStatus = "idle";
    },
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.isAuthenticated = true;

      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(user));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loginStatus = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginStatus = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        // Set isAuthenticated based on accessToken
        state.isAuthenticated = !!action.payload.accessToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginStatus = "failed";
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })

      // Signup
      .addCase(signup.pending, (state) => {
        state.signupStatus = "loading";
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.signupStatus = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.signupStatus = "failed";
        state.error = action.payload || "Signup failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.logoutStatus = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.logoutStatus = "succeeded";
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.logoutStatus = "failed";
        // Still clear credentials on logout failure
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })

      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Auth check failed";
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.profileUpdateStatus = "loading";
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileUpdateStatus = "succeeded";
        if (state.user && action.payload.user) {
          state.user = { ...state.user, ...action.payload.user };
          localStorage.setItem("user", JSON.stringify(state.user));
        }
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileUpdateStatus = "failed";
        state.error = action.payload || "Profile update failed";
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.passwordResetStatus = "loading";
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.passwordResetStatus = "succeeded";
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.passwordResetStatus = "failed";
        state.error = action.payload || "Password reset request failed";
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.passwordResetStatus = "loading";
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordResetStatus = "succeeded";
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordResetStatus = "failed";
        state.error = action.payload || "Password reset failed";
      });
  },
});

// Export actions
export const { clearError, clearStatuses, setCredentials, clearCredentials } =
  authSlice.actions;

// Selectors with proper typing
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.token;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthStatus = (state: { auth: AuthState }) =>
  state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectLoginStatus = (state: { auth: AuthState }) =>
  state.auth.loginStatus;
export const selectSignupStatus = (state: { auth: AuthState }) =>
  state.auth.signupStatus;
export const selectLogoutStatus = (state: { auth: AuthState }) =>
  state.auth.logoutStatus;
export const selectProfileUpdateStatus = (state: { auth: AuthState }) =>
  state.auth.profileUpdateStatus;
export const selectPasswordResetStatus = (state: { auth: AuthState }) =>
  state.auth.passwordResetStatus;

// Export reducer
export default authSlice.reducer;
