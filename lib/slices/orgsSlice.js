import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { fakeApi } from "../fakeApi"
import { realApi } from "../realApi";

const initialState = {
  list: [],
  currentOrg: null,
  members: [],
  status: "idle",
  error: null,
  meta: { total: 0, page: 1, limit: 10 },
};

// Async thunks
export const fetchOrgs = createAsyncThunk("orgs/fetchOrgs", async (params) => {
  const response = await realApi.orgs.getAll(params);
  console.log("response is", response);
  return response;
});

export const fetchOrgById = createAsyncThunk(
  "orgs/fetchOrgById",
  async (orgId) => {
    const response = await realApi.orgs.getById(orgId);
    return response.data;
  }
);

export const createOrg = createAsyncThunk("orgs/createOrg", async (orgData) => {
  const response = await realApi.orgs.create(orgData);
  return response.data;
});

export const updateOrg = createAsyncThunk(
  "orgs/updateOrg",
  async ({ orgId, data }) => {
    const response = await realApi.orgs.update(orgId, data);
    return response.data;
  }
);

export const deleteOrg = createAsyncThunk("orgs/deleteOrg", async (orgId) => {
  await realApi.orgs.delete(orgId);
  return orgId;
});

export const fetchOrgMembers = createAsyncThunk(
  "orgs/fetchMembers",
  async (orgId) => {
    const response = await realApi.orgs.getMembers(orgId);

    return response.data;
  }
);

export const inviteMember = createAsyncThunk(
  "orgs/inviteMember",
  async ({ orgId, data }) => {
    const response = await realApi.orgs.inviteMember(orgId, data);
    return response.data;
  }
);

export const removeMember = createAsyncThunk(
  "orgs/removeMember",
  async ({ orgId, memberId }) => {
    await realApi.orgs.removeMember(orgId, memberId);
    return memberId;
  }
);

const orgsSlice = createSlice({
  name: "orgs",
  initialState,
  reducers: {
    clearCurrentOrg: (state) => {
      state.currentOrg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orgs
      .addCase(fetchOrgs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrgs.fulfilled, (state, action) => {
        console.log("organization", action);
        state.status = "succeeded";
        state.list = action.payload?.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchOrgs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Fetch org by ID
      .addCase(fetchOrgById.fulfilled, (state, action) => {
        state.currentOrg = action.payload;
      })
      // Create org
      .addCase(createOrg.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // Update org
      .addCase(updateOrg.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (org) => org.id === action.payload.id
        );
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentOrg?.id === action.payload.id) {
          state.currentOrg = action.payload;
        }
      })
      // Delete org
      .addCase(deleteOrg.fulfilled, (state, action) => {
        state.list = state.list.filter((org) => org.id !== action.payload);
      })
      // Fetch members
      .addCase(fetchOrgMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      });
  },
});

export const { clearCurrentOrg } = orgsSlice.actions;
export default orgsSlice.reducer;
