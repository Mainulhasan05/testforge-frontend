import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi"
import { realApi } from "../realApi";

const initialState = {
  list: [],
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
};

// Async thunks
export const fetchFeedback = createAsyncThunk(
  "feedback/fetchFeedback",
  async ({ caseId, params }) => {
    const response = await realApi.feedback.getAll(caseId, params);
    return response.data;
  }
);

export const createFeedback = createAsyncThunk(
  "feedback/createFeedback",
  async ({ caseId, data }) => {
    const response = await realApi.feedback.create(caseId, data);
    return response.data;
  }
);

export const updateFeedback = createAsyncThunk(
  "feedback/updateFeedback",
  async ({ feedbackId, data }) => {
    const response = await realApi.feedback.update(feedbackId, data);
    return response.data;
  }
);

export const deleteFeedback = createAsyncThunk(
  "feedback/deleteFeedback",
  async (feedbackId) => {
    await realApi.feedback.delete(feedbackId);
    return feedbackId;
  }
);

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch feedback
      .addCase(fetchFeedback.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchFeedback.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Create feedback
      .addCase(createFeedback.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // Update feedback
      .addCase(updateFeedback.fulfilled, (state, action) => {
        const index = state.list.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      // Delete feedback
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.list = state.list.filter((f) => f.id !== action.payload);
      });
  },
});

export default feedbackSlice.reducer;
