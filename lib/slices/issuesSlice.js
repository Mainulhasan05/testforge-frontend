import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { realApi } from '../realApi';

// Async thunks
export const fetchIssues = createAsyncThunk(
  'issues/fetchAll',
  async ({ orgId, filters }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.getAll(orgId, filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIssueById = createAsyncThunk(
  'issues/fetchById',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.getById(issueId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createIssue = createAsyncThunk(
  'issues/create',
  async ({ orgId, issueData }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.create(orgId, issueData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/update',
  async ({ issueId, issueData }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.update(issueId, issueData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateIssueStatus = createAsyncThunk(
  'issues/updateStatus',
  async ({ issueId, status, resolutionNotes }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.updateStatus(issueId, { status, resolutionNotes });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/delete',
  async (issueId, { rejectWithValue }) => {
    try {
      await realApi.issues.delete(issueId);
      return issueId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'issues/addComment',
  async ({ issueId, text, imageIds }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.addComment(issueId, { text, imageIds });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateComment = createAsyncThunk(
  'issues/updateComment',
  async ({ issueId, commentId, text }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.updateComment(issueId, commentId, { text });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'issues/deleteComment',
  async ({ issueId, commentId }, { rejectWithValue }) => {
    try {
      await realApi.issues.deleteComment(issueId, commentId);
      return { issueId, commentId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const voteOnIssue = createAsyncThunk(
  'issues/vote',
  async ({ issueId, voteType, comment }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.vote(issueId, { voteType, comment });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeVote = createAsyncThunk(
  'issues/removeVote',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.removeVote(issueId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleWatch = createAsyncThunk(
  'issues/toggleWatch',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.toggleWatch(issueId);
      return { issueId, ...response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignIssue = createAsyncThunk(
  'issues/assign',
  async ({ issueId, assignToUserId }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.assign(issueId, { assignToUserId });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addImages = createAsyncThunk(
  'issues/addImages',
  async ({ issueId, imageIds, captions }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.addImages(issueId, { imageIds, captions });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeImage = createAsyncThunk(
  'issues/removeImage',
  async ({ issueId, imageId }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.removeImage(issueId, imageId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generateAITicket = createAsyncThunk(
  'issues/generateAI',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.generateAITicket(issueId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createJiraTicket = createAsyncThunk(
  'issues/createJira',
  async ({ issueId, orgId, ticketData }, { rejectWithValue }) => {
    try {
      const response = await realApi.jira.createTicket(issueId, { orgId, ticketData });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncJiraTicket = createAsyncThunk(
  'issues/syncJira',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await realApi.jira.syncTicket(issueId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const notifyMembers = createAsyncThunk(
  'issues/notify',
  async ({ issueId, customMessage }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.notifyMembers(issueId, { customMessage });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const notifyMembersMultiple = createAsyncThunk(
  'issues/notifyMultiple',
  async ({ orgId, issueIds, customMessage }, { rejectWithValue }) => {
    try {
      const response = await realApi.issues.notifyMembersMultiple(orgId, { issueIds, customMessage });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Jira configuration thunks
export const fetchJiraConfig = createAsyncThunk(
  'issues/fetchJiraConfig',
  async (orgId, { rejectWithValue }) => {
    try {
      const response = await realApi.jira.getConfig(orgId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveJiraConfig = createAsyncThunk(
  'issues/saveJiraConfig',
  async ({ orgId, configData }, { rejectWithValue }) => {
    try {
      const response = await realApi.jira.saveConfig(orgId, configData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteJiraConfig = createAsyncThunk(
  'issues/deleteJiraConfig',
  async (orgId, { rejectWithValue }) => {
    try {
      await realApi.jira.deleteConfig(orgId);
      return orgId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const testJiraConnection = createAsyncThunk(
  'issues/testJiraConnection',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await realApi.jira.testConnection(configData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const issuesSlice = createSlice({
  name: 'issues',
  initialState: {
    list: [],
    currentIssue: null,
    stats: {
      total: 0,
      open: 0,
      resolved: 0,
      critical: 0
    },
    filters: {
      status: 'all',
      priority: 'all',
      category: 'all',
      assignee: 'all',
      search: ''
    },
    loading: false,
    error: null,

    // AI & Jira states
    aiGenerating: false,
    aiTicketData: null,
    jiraCreating: false,
    jiraSyncing: false,

    // Jira config
    jiraConfig: null,
    jiraConfigLoading: false,
    jiraTestResult: null,

    // Upload states
    uploading: false,
    uploadProgress: 0,

    // Notification state
    notifying: false,

    // Pagination
    meta: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  },

  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentIssue: (state) => {
      state.currentIssue = null;
      state.aiTicketData = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearJiraTestResult: (state) => {
      state.jiraTestResult = null;
    }
  },

  extraReducers: (builder) => {
    // Fetch issues
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.meta = action.payload.meta;
        state.stats = action.payload.meta.stats || state.stats;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch issue by ID
    builder
      .addCase(fetchIssueById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssueById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIssue = action.payload.data;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create issue
    builder
      .addCase(createIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload.data);
        state.stats.total += 1;
        state.stats.open += 1;
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update issue
    builder
      .addCase(updateIssue.fulfilled, (state, action) => {
        const index = state.list.findIndex(i => i._id === action.payload.data._id);
        if (index !== -1) {
          state.list[index] = action.payload.data;
        }
        if (state.currentIssue && state.currentIssue._id === action.payload.data._id) {
          state.currentIssue = action.payload.data;
        }
      });

    // Update status
    builder
      .addCase(updateIssueStatus.fulfilled, (state, action) => {
        const issue = action.payload.data;
        const index = state.list.findIndex(i => i._id === issue._id);
        if (index !== -1) {
          state.list[index] = issue;
        }
        if (state.currentIssue && state.currentIssue._id === issue._id) {
          state.currentIssue = issue;
        }
      });

    // Delete issue
    builder
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.list = state.list.filter(i => i._id !== action.payload);
        state.currentIssue = null;
        state.stats.total -= 1;
      });

    // Generate AI ticket
    builder
      .addCase(generateAITicket.pending, (state) => {
        state.aiGenerating = true;
        state.error = null;
      })
      .addCase(generateAITicket.fulfilled, (state, action) => {
        state.aiGenerating = false;
        state.aiTicketData = action.payload.data;
      })
      .addCase(generateAITicket.rejected, (state, action) => {
        state.aiGenerating = false;
        state.error = action.payload;
      });

    // Create Jira ticket
    builder
      .addCase(createJiraTicket.pending, (state) => {
        state.jiraCreating = true;
        state.error = null;
      })
      .addCase(createJiraTicket.fulfilled, (state, action) => {
        state.jiraCreating = false;
        if (state.currentIssue) {
          state.currentIssue.jiraTicket = action.payload.data;
        }
      })
      .addCase(createJiraTicket.rejected, (state, action) => {
        state.jiraCreating = false;
        state.error = action.payload;
      });

    // Sync Jira ticket
    builder
      .addCase(syncJiraTicket.pending, (state) => {
        state.jiraSyncing = true;
      })
      .addCase(syncJiraTicket.fulfilled, (state, action) => {
        state.jiraSyncing = false;
        if (state.currentIssue && action.payload.data.changed) {
          state.currentIssue.status = action.payload.data.status;
        }
      })
      .addCase(syncJiraTicket.rejected, (state, action) => {
        state.jiraSyncing = false;
        state.error = action.payload;
      });

    // Notify members
    builder
      .addCase(notifyMembers.pending, (state) => {
        state.notifying = true;
      })
      .addCase(notifyMembers.fulfilled, (state) => {
        state.notifying = false;
      })
      .addCase(notifyMembers.rejected, (state, action) => {
        state.notifying = false;
        state.error = action.payload;
      });

    // Notify multiple
    builder
      .addCase(notifyMembersMultiple.pending, (state) => {
        state.notifying = true;
      })
      .addCase(notifyMembersMultiple.fulfilled, (state) => {
        state.notifying = false;
      })
      .addCase(notifyMembersMultiple.rejected, (state, action) => {
        state.notifying = false;
        state.error = action.payload;
      });

    // Jira config
    builder
      .addCase(fetchJiraConfig.pending, (state) => {
        state.jiraConfigLoading = true;
      })
      .addCase(fetchJiraConfig.fulfilled, (state, action) => {
        state.jiraConfigLoading = false;
        state.jiraConfig = action.payload.data;
      })
      .addCase(fetchJiraConfig.rejected, (state, action) => {
        state.jiraConfigLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(saveJiraConfig.fulfilled, (state, action) => {
        state.jiraConfig = action.payload.data;
      });

    builder
      .addCase(deleteJiraConfig.fulfilled, (state) => {
        state.jiraConfig = null;
      });

    builder
      .addCase(testJiraConnection.pending, (state) => {
        state.jiraTestResult = null;
      })
      .addCase(testJiraConnection.fulfilled, (state, action) => {
        state.jiraTestResult = action.payload.data;
      })
      .addCase(testJiraConnection.rejected, (state, action) => {
        state.jiraTestResult = { success: false, message: action.payload };
      });
  }
});

export const { setFilters, clearCurrentIssue, clearError, setUploadProgress, clearJiraTestResult } = issuesSlice.actions;
export default issuesSlice.reducer;
