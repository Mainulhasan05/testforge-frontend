/**
 * Real API Layer (Template)
 * Replace fakeApi.js imports with this file when backend is ready
 * Uses fetch/axios to make actual HTTP requests
 */
import Cookie from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

  console.log("response", response);
  console.log(response.status === 401);

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
      await delay(API_DELAY);

      // Check if user exists by email
      let user = db.users.find((u) => u.email === data.email);

      // If user doesn't exist, create a new user
      if (!user) {
        user = {
          id: generateId(),
          email: data.email,
          name: data.name || data.email.split("@")[0],
          createdAt: now(),
        };
        db.users.push(user);
      }

      // Check if already a member
      const existingMember = db.orgMembers.find(
        (m) => m.orgId === orgId && m.userId === user.id
      );
      if (existingMember) {
        throw new Error("User is already a member");
      }

      // Add as member
      const newMember = {
        id: generateId(),
        orgId,
        userId: user.id,
        role: data.role || "member",
        joinedAt: now(),
      };
      db.orgMembers.push(newMember);

      return successResponse({ ...newMember, user });
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
