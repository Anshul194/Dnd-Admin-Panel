/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}

export interface AuthResponse {
  refresh?: string;
  access?: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  access: string;
  refresh: string;
  success: boolean;
  message: string;
  data: T;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  loginStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  signupStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  logoutStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  profileUpdateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  passwordResetStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface PasswordResetData {
  token: string;
  password: string;
}