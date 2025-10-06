import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi"
import { realApi } from "../realApi";

const initialState = {
  list: [],
  currentCase: null,
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
};

// Async thunks
export const fetchCases = createAsyncThunk(
  "cases/fetchCases",
  async ({ featureId, params }) => {
    const response = await realApi.cases.getAll(featureId, params);
    return response.data;
  }
);

export const fetchCaseById = createAsyncThunk(
  "cases/fetchCaseById",
  async (caseId) => {
    const response = await realApi.cases.getById(caseId);
    return response.data;
  }
);

export const createCase = createAsyncThunk(
  "cases/createCase",
  async ({ featureId, data }) => {
    const response = await realApi.cases.create(featureId, data);
    return response.data;
  }
);

export const updateCase = createAsyncThunk(
  "cases/updateCase",
  async ({ caseId, data }) => {
    const response = await realApi.cases.update(caseId, data);
    return response.data;
  }
);

export const deleteCase = createAsyncThunk(
  "cases/deleteCase",
  async (caseId) => {
    await realApi.cases.delete(caseId);
    return caseId;
  }
);

const casesSlice = createSlice({
  name: "cases",
  initialState,
  reducers: {
    clearCurrentCase: (state) => {
      state.currentCase = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
      .addCase(fetchCases.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Fetch case by ID
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.currentCase = action.payload;
      })
      // Create case
      .addCase(createCase.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // Update case
      .addCase(updateCase.fulfilled, (state, action) => {
        const index = state.list.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentCase?.id === action.payload.id) {
          state.currentCase = action.payload;
        }
      })
      // Delete case
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearCurrentCase } = casesSlice.actions;
export default casesSlice.reducer;
