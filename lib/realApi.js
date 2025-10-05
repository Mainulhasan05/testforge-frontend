/**
 * Real API Layer (Template)
 * Replace fakeApi.js imports with this file when backend is ready
 * Uses fetch/axios to make actual HTTP requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

// Helper to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken()
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Request failed")
  }

  return response.json()
}

export const realApi = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      return fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
    },

    signup: async (userData) => {
      return fetchWithAuth("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      })
    },

    logout: async () => {
      return fetchWithAuth("/auth/logout", {
        method: "POST",
      })
    },
  },

  // Organizations endpoints
  orgs: {
    getAll: async (params) => {
      const queryString = new URLSearchParams(params).toString()
      return fetchWithAuth(`/orgs?${queryString}`)
    },

    getById: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}`)
    },

    create: async (data) => {
      return fetchWithAuth("/orgs", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (orgId, data) => {
      return fetchWithAuth(`/orgs/${orgId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },

    delete: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}`, {
        method: "DELETE",
      })
    },

    getMembers: async (orgId) => {
      return fetchWithAuth(`/orgs/${orgId}/members`)
    },
  },

  // Sessions endpoints
  sessions: {
    getAll: async (orgId, params) => {
      const queryString = new URLSearchParams(params).toString()
      return fetchWithAuth(`/orgs/${orgId}/sessions?${queryString}`)
    },

    getById: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}`)
    },

    create: async (orgId, data) => {
      return fetchWithAuth(`/orgs/${orgId}/sessions`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (sessionId, data) => {
      return fetchWithAuth(`/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },

    delete: async (sessionId) => {
      return fetchWithAuth(`/sessions/${sessionId}`, {
        method: "DELETE",
      })
    },
  },

  // Features endpoints
  features: {
    getAll: async (sessionId, params) => {
      const queryString = new URLSearchParams(params).toString()
      return fetchWithAuth(`/sessions/${sessionId}/features?${queryString}`)
    },

    getById: async (featureId) => {
      return fetchWithAuth(`/features/${featureId}`)
    },

    create: async (sessionId, data) => {
      return fetchWithAuth(`/sessions/${sessionId}/features`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (featureId, data) => {
      return fetchWithAuth(`/features/${featureId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },

    delete: async (featureId) => {
      return fetchWithAuth(`/features/${featureId}`, {
        method: "DELETE",
      })
    },
  },

  // Cases endpoints
  cases: {
    getAll: async (featureId, params) => {
      const queryString = new URLSearchParams(params).toString()
      return fetchWithAuth(`/features/${featureId}/cases?${queryString}`)
    },

    getById: async (caseId) => {
      return fetchWithAuth(`/cases/${caseId}`)
    },

    create: async (featureId, data) => {
      return fetchWithAuth(`/features/${featureId}/cases`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (caseId, data) => {
      return fetchWithAuth(`/cases/${caseId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },

    delete: async (caseId) => {
      return fetchWithAuth(`/cases/${caseId}`, {
        method: "DELETE",
      })
    },
  },

  // Feedback endpoints
  feedback: {
    getAll: async (caseId, params) => {
      const queryString = new URLSearchParams(params).toString()
      return fetchWithAuth(`/cases/${caseId}/feedback?${queryString}`)
    },

    create: async (caseId, data) => {
      return fetchWithAuth(`/cases/${caseId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (feedbackId, data) => {
      return fetchWithAuth(`/feedback/${feedbackId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },

    delete: async (feedbackId) => {
      return fetchWithAuth(`/feedback/${feedbackId}`, {
        method: "DELETE",
      })
    },
  },

  // Changelog endpoints
  changelog: {
    getAll: async (entityType, entityId, params) => {
      const queryString = new URLSearchParams(params).toString()
      let url = "/changelog"
      if (entityType && entityId) {
        url = `/changelog/${entityType}/${entityId}`
      }
      return fetchWithAuth(`${url}?${queryString}`)
    },
  },
}
