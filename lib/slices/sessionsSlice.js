import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi"
import { realApi } from "../realApi";

const initialState = {
  list: [],
  currentSession: null,
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
};

// Async thunks
export const fetchSessions = createAsyncThunk(
  "sessions/fetchSessions",
  async ({ orgId, params }) => {
    const response = await realApi.sessions.getAll(orgId, params);
    return response;
  }
);

export const fetchSessionById = createAsyncThunk(
  "sessions/fetchSessionById",
  async (sessionId) => {
    const response = await realApi.sessions.getById(sessionId);
    return response.data;
  }
);

export const createSession = createAsyncThunk(
  "sessions/createSession",
  async ({ orgId, data }) => {
    const response = await realApi.sessions.create(orgId, data);
    return response.data;
  }
);

export const updateSession = createAsyncThunk(
  "sessions/updateSession",
  async ({ sessionId, data }) => {
    const response = await realApi.sessions.update(sessionId, data);
    return response.data;
  }
);

export const deleteSession = createAsyncThunk(
  "sessions/deleteSession",
  async (sessionId) => {
    await realApi.sessions.delete(sessionId);
    return sessionId;
  }
);

export const assignUserToSession = createAsyncThunk(
  "sessions/assignUser",
  async ({ sessionId, userId }) => {
    const response = await realApi.sessions.assignUser(sessionId, userId);
    return { sessionId, userId, data: response.data };
  }
);

export const unassignUserFromSession = createAsyncThunk(
  "sessions/unassignUser",
  async ({ sessionId, userId }) => {
    await realApi.sessions.unassignUser(sessionId, userId);
    return { sessionId, userId };
  }
);

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log("sessions", action);
        state.list = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Fetch session by ID
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      // Create session
      .addCase(createSession.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // Update session
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.list.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      // Delete session
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
      });
  },
});

export const { clearCurrentSession } = sessionsSlice.actions;
export default sessionsSlice.reducer;
