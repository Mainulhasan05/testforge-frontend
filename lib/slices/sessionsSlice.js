import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { fakeApi } from "../fakeApi"

const initialState = {
  list: [],
  currentSession: null,
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
}

// Async thunks
export const fetchSessions = createAsyncThunk("sessions/fetchSessions", async ({ orgId, params }) => {
  const response = await fakeApi.sessions.getAll(orgId, params)
  return response.data
})

export const fetchSessionById = createAsyncThunk("sessions/fetchSessionById", async (sessionId) => {
  const response = await fakeApi.sessions.getById(sessionId)
  return response.data
})

export const createSession = createAsyncThunk("sessions/createSession", async ({ orgId, data }) => {
  const response = await fakeApi.sessions.create(orgId, data)
  return response.data
})

export const updateSession = createAsyncThunk("sessions/updateSession", async ({ sessionId, data }) => {
  const response = await fakeApi.sessions.update(sessionId, data)
  return response.data
})

export const deleteSession = createAsyncThunk("sessions/deleteSession", async (sessionId) => {
  await fakeApi.sessions.delete(sessionId)
  return sessionId
})

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearCurrentSession: (state) => {
      state.currentSession = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.list = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message
      })
      // Fetch session by ID
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.currentSession = action.payload
      })
      // Create session
      .addCase(createSession.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
      })
      // Update session
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.list.findIndex((s) => s.id === action.payload.id)
        if (index !== -1) {
          state.list[index] = action.payload
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload
        }
      })
      // Delete session
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload)
      })
  },
})

export const { clearCurrentSession } = sessionsSlice.actions
export default sessionsSlice.reducer
