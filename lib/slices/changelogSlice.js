import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { fakeApi } from "../fakeApi"

const initialState = {
  list: [],
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 20 },
}

// Async thunks
export const fetchChangelog = createAsyncThunk("changelog/fetchChangelog", async ({ entityType, entityId, params }) => {
  const response = await fakeApi.changelog.getAll(entityType, entityId, params)
  return response.data
})

const changelogSlice = createSlice({
  name: "changelog",
  initialState,
  reducers: {
    clearChangelog: (state) => {
      state.list = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChangelog.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchChangelog.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.list = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchChangelog.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message
      })
  },
})

export const { clearChangelog } = changelogSlice.actions
export default changelogSlice.reducer
