import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi"
import { realApi } from "../realApi";
import Cookie from "js-cookie";

// Load initial auth state from localStorage
const loadAuthFromStorage = () => {
  if (typeof window === "undefined") return { user: null, token: null };
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("authUser");
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

const initialAuth = loadAuthFromStorage();

const initialState = {
  user: initialAuth.user,
  token: initialAuth.token,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async thunks
export const login = createAsyncThunk("auth/login", async (credentials) => {
  const response = await realApi.auth.login(credentials);
  return response.data;
});

export const signup = createAsyncThunk("auth/signup", async (userData) => {
  const response = await realApi.auth.signup(userData);
  return response.data;
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await realApi.auth.logout();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log(action);
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        // Persist to cookie
        Cookie.set("authToken", action.payload.accessToken);
        Cookie.set("authUser", JSON.stringify(action.payload.user));
        // Persist to localStorage
        localStorage.setItem("authToken", action.payload.accessToken);
        localStorage.setItem("authUser", JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("authToken", action.payload.token);
        localStorage.setItem("authUser", JSON.stringify(action.payload.user));
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
