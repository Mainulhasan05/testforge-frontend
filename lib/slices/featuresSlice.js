import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { fakeApi } from "../fakeApi"

const initialState = {
  list: [],
  currentFeature: null,
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
}

// Async thunks
export const fetchFeatures = createAsyncThunk("features/fetchFeatures", async ({ sessionId, params }) => {
  const response = await fakeApi.features.getAll(sessionId, params)
  return response.data
})

export const fetchFeatureById = createAsyncThunk("features/fetchFeatureById", async (featureId) => {
  const response = await fakeApi.features.getById(featureId)
  return response.data
})

export const createFeature = createAsyncThunk("features/createFeature", async ({ sessionId, data }) => {
  const response = await fakeApi.features.create(sessionId, data)
  return response.data
})

export const updateFeature = createAsyncThunk("features/updateFeature", async ({ featureId, data }) => {
  const response = await fakeApi.features.update(featureId, data)
  return response.data
})

export const deleteFeature = createAsyncThunk("features/deleteFeature", async (featureId) => {
  await fakeApi.features.delete(featureId)
  return featureId
})

const featuresSlice = createSlice({
  name: "features",
  initialState,
  reducers: {
    clearCurrentFeature: (state) => {
      state.currentFeature = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch features
      .addCase(fetchFeatures.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchFeatures.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.list = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchFeatures.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message
      })
      // Fetch feature by ID
      .addCase(fetchFeatureById.fulfilled, (state, action) => {
        state.currentFeature = action.payload
      })
      // Create feature
      .addCase(createFeature.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
      })
      // Update feature
      .addCase(updateFeature.fulfilled, (state, action) => {
        const index = state.list.findIndex((f) => f.id === action.payload.id)
        if (index !== -1) {
          state.list[index] = action.payload
        }
        if (state.currentFeature?.id === action.payload.id) {
          state.currentFeature = action.payload
        }
      })
      // Delete feature
      .addCase(deleteFeature.fulfilled, (state, action) => {
        state.list = state.list.filter((f) => f.id !== action.payload)
      })
  },
})

export const { clearCurrentFeature } = featuresSlice.actions
export default featuresSlice.reducer
