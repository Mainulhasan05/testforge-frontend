/**
 * Real API Layer (Template)
 * Replace fakeApi.js imports with this file when backend is ready
 * Uses fetch/axios to make actual HTTP requests
 */
import Cookie from "js-cookie";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.103:5000/api";

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return Cookie.get("authToken");
};

// Get refresh token
const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return Cookie.get("authRefreshToken");
};
// Call refresh endpoint
const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }
    const data = await response.json();
    // Save new token in cookie
    if (data.data.accessToken) {
      Cookie.set("authToken", data.data.accessToken, {
        secure: true,
        sameSite: "Strict",
      });
      Cookie.set("authRefreshToken", data.data.refreshToken, {
        secure: true,
        sameSite: "Strict",
      });
    }
    return data.data.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    //Optionally clear cookies if refresh fails
    Cookie.remove("authToken");
    Cookie.remove("authRefreshToken");
    return null;
  }
};

// Helper to make authenticated requests
const fetchWithAuth = async (url, options = {}, retry = true) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // If unauthorized, try refresh flow
  if (response.status === 401 && retry) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    const error = await response.json();
    toast.error(error.message || "Request failed");
    console.log("error", error);
    throw new Error(error.error || "Request failed");
  }

  return response.json();
};

export const realApi = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      return fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },

    signup: async (userData) => {
      return fetchWithAuth("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },

    logout: async () => {
      return fetchWithAuth("/auth/logout", {
        method: "POST",
      });
    },
    // create routes for forgot-password and reset-password
    forgotPassword: async (email) => {
      return fetchWithAuth("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (token, password) => {
      return fetchWithAuth("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
    },
  },

  // Organizations endpoints
  orgs: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/orgs?${queryString}`);
    },

    getById: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}`);
    },

    create: async (data) => {
      return fetchWithAuth("/orgs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (orgId, data) => {
      return fetchWithAuth(`/orgs/${orgId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}`, {
        method: "DELETE",
      });
    },

    getMembers: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}/members`);
    },
    inviteMember: async (orgId, data) => {
      return fetchWithAuth(`/invitations/${orgId}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    removeMember: async (orgId, memberId) => {
      await delay(API_DELAY);
      const index = db.orgMembers.findIndex(
        (m) => m.id === memberId && m.orgId === orgId
      );
      if (index === -1) throw new Error("Member not found");

      db.orgMembers.splice(index, 1);
      return successResponse({ message: "Member removed" });
    },
  },

  // Sessions endpoints
  sessions: {
    getAll: async (orgId, params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/orgs/${orgId}/sessions?${queryString}`);
    },

    getById: async (sessionId) => {
      return fetchWithAuth(`/orgs/sessions/${sessionId}`);
    },

    getDashboard: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}/dashboard`);
    },

    getProgress: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}/progress`);
    },

    getAllProgress: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}/progress/all`);
    },

    getFeatureStatistics: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}/feature-statistics`);
    },

    create: async (orgId, data) => {
      return fetchWithAuth(`/orgs/${orgId}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (sessionId, data) => {
      return fetchWithAuth(`/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}`, {
        method: "DELETE",
      });
    },

    duplicate: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}/duplicate`, {
        method: "POST",
      });
    },

    assignUser: async (sessionId, userId) => {
      return fetchWithAuth(`/orgs/${sessionId}/assign`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },

    unassignUser: async (sessionId, userId) => {
      return fetchWithAuth(`/sessions/${sessionId}/unassign`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },
  },

  // Features endpoints
  features: {
    getAll: async (sessionId, params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/sessions/${sessionId}/features?${queryString}`);
    },

    getById: async (featureId) => {
      return fetchWithAuth(`/sessions/features/${featureId}`);
    },

    create: async (sessionId, data) => {
      return fetchWithAuth(`/sessions/${sessionId}/features`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (featureId, data) => {
      return fetchWithAuth(`/features/${featureId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (featureId) => {
      return fetchWithAuth(`/features/${featureId}`, {
        method: "DELETE",
      });
    },
  },

  // Cases endpoints
  cases: {
    getAll: async (featureId, params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/features/${featureId}/cases?${queryString}`);
    },

    getById: async (caseId) => {
      return fetchWithAuth(`/features/cases/${caseId}`);
    },

    create: async (featureId, data) => {
      return fetchWithAuth(`/features/${featureId}/cases`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (caseId, data) => {
      return fetchWithAuth(`/features/cases/${caseId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (caseId) => {
      return fetchWithAuth(`/features/cases/${caseId}`, {
        method: "DELETE",
      });
    },
  },

  // Feedback endpoints
  feedback: {
    getAll: async (caseId, params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/cases/${caseId}/feedback?${queryString}`);
    },

    getMy: async (caseId) => {
      return fetchWithAuth(`/cases/${caseId}/feedback/my`);
    },

    create: async (caseId, data) => {
      return fetchWithAuth(`/cases/${caseId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (feedbackId, data) => {
      return fetchWithAuth(`/feedback/${feedbackId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    delete: async (feedbackId) => {
      return fetchWithAuth(`/feedback/${feedbackId}`, {
        method: "DELETE",
      });
    },
  },
  invitations: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/invitations?${queryString}`);
    },

    getCount: async () => {
      return fetchWithAuth(`/invitations/count`);
    },

    accept: async (token) => {
      console.log("token", token);
      return fetchWithAuth(`/invitations/accept`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },

    decline: async (invitationId) => {
      return fetchWithAuth(`/invitations/${invitationId}/decline`, {
        method: "POST",
      });
    },

    verify: async (token) => {
      return fetchWithAuth(`/invitations/verify/${token}`);
    },
  },

  // Changelog endpoints
  changelog: {
    getAll: async (entityType, entityId, params) => {
      const queryString = new URLSearchParams(params).toString();
      let url = "/changelog";
      if (entityType && entityId) {
        url = `/changelog/${entityType}/${entityId}`;
      }
      return fetchWithAuth(`${url}?${queryString}`);
    },
  },
};
