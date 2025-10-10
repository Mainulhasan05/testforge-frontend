import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi";
import { realApi } from "../realApi";

// Async thunks
export const fetchInvitations = createAsyncThunk(
  "invitations/fetchAll",
  async (params = {}) => {
    const response = await realApi.invitations.getAll(params);
    return response;
  }
);

export const acceptInvitation = createAsyncThunk(
  "invitations/accept",
  async (token) => {
    const response = await realApi.invitations.accept(token);
    return response.data;
  }
);

export const declineInvitation = createAsyncThunk(
  "invitations/decline",
  async (invitationId) => {
    const response = await realApi.invitations.decline(invitationId);
    return response.data;
  }
);

const invitationsSlice = createSlice({
  name: "invitations",
  initialState: {
    invitations: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    status: "idle",
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch invitations
      .addCase(fetchInvitations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.invitations = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Accept invitation
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        const index = state.invitations.findIndex(
          (inv) => inv.id === action.payload.id
        );
        if (index !== -1) {
          state.invitations[index] = action.payload;
        }
      })
      // Decline invitation
      .addCase(declineInvitation.fulfilled, (state, action) => {
        const index = state.invitations.findIndex(
          (inv) => inv.id === action.payload.id
        );
        if (index !== -1) {
          state.invitations[index] = action.payload;
        }
      });
  },
});

export const { clearError } = invitationsSlice.actions;
export default invitationsSlice.reducer;
