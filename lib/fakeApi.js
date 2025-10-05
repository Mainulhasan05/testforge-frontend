/**
 * Fake API Layer
 * Simulates backend API with latency, pagination, and filtering
 * Easily replaceable with realApi.js
 */

// Simulated latency (ms)
const API_DELAY = 300

// Helper to simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate IDs
let idCounter = 1000
const generateId = () => `${idCounter++}`

// Helper to get current UTC timestamp
const now = () => new Date().toISOString()

// In-memory data store
const db = {
  users: [
    {
      id: "1",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  orgs: [
    {
      id: "1",
      name: "Demo Organization",
      description: "A sample organization for testing",
      ownerId: "1",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  orgMembers: [
    {
      id: "1",
      orgId: "1",
      userId: "1",
      role: "owner",
      joinedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  sessions: [
    {
      id: "1",
      orgId: "1",
      title: "Sprint 1 Testing",
      description: "Testing session for sprint 1 features",
      status: "active",
      startDate: "2024-01-15T00:00:00.000Z",
      endDate: "2024-01-30T00:00:00.000Z",
      createdAt: "2024-01-10T00:00:00.000Z",
      updatedAt: "2024-01-10T00:00:00.000Z",
    },
  ],
  sessionAssignees: [
    {
      sessionId: "1",
      userId: "1",
      assignedAt: "2024-01-10T00:00:00.000Z",
    },
  ],
  features: [
    {
      id: "1",
      sessionId: "1",
      title: "User Authentication",
      description: "Login and signup functionality",
      status: "in-progress",
      createdAt: "2024-01-11T00:00:00.000Z",
      updatedAt: "2024-01-11T00:00:00.000Z",
    },
  ],
  cases: [
    {
      id: "1",
      featureId: "1",
      title: "Login with valid credentials",
      note: "User should be able to login with correct email and password",
      expectedOutput: "User is redirected to dashboard",
      status: "pass",
      createdAt: "2024-01-12T00:00:00.000Z",
      updatedAt: "2024-01-12T00:00:00.000Z",
    },
  ],
  feedback: [
    {
      id: "1",
      caseId: "1",
      userId: "1",
      result: "pass",
      comment: "Works as expected",
      createdAt: "2024-01-13T00:00:00.000Z",
    },
  ],
  changelog: [
    {
      id: "1",
      entityType: "session",
      entityId: "1",
      userId: "1",
      action: "created",
      changes: { title: "Sprint 1 Testing" },
      createdAt: "2024-01-10T00:00:00.000Z",
    },
  ],
}

// Helper to paginate and filter arrays
const paginateAndFilter = (items, params = {}) => {
  const { page = 1, limit = 10, status, q } = params
  let filtered = [...items]

  // Filter by status
  if (status) {
    filtered = filtered.filter((item) => item.status === status)
  }

  // Search by query (searches title, name, description fields)
  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter((item) => {
      const searchableFields = [item.title, item.name, item.description, item.email].filter(Boolean)
      return searchableFields.some((field) => field.toLowerCase().includes(query))
    })
  }

  // Paginate
  const total = filtered.length
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedItems = filtered.slice(startIndex, endIndex)

  return {
    items: paginatedItems,
    meta: {
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Common response format
const successResponse = (data) => ({
  success: true,
  data,
  error: null,
})

const errorResponse = (message) => ({
  success: false,
  data: null,
  error: message,
})

// Auth token storage (simulated)
let currentToken = null

export const fakeApi = {
  // Auth endpoints
  auth: {
    login: async ({ email, password }) => {
      await delay(API_DELAY)

      const user = db.users.find((u) => u.email === email)
      if (!user || password !== "password") {
        throw new Error("Invalid credentials")
      }

      currentToken = `fake-token-${user.id}-${Date.now()}`
      return successResponse({
        user,
        token: currentToken,
      })
    },

    signup: async ({ email, password, name }) => {
      await delay(API_DELAY)

      const existingUser = db.users.find((u) => u.email === email)
      if (existingUser) {
        throw new Error("User already exists")
      }

      const newUser = {
        id: generateId(),
        email,
        name,
        createdAt: now(),
      }

      db.users.push(newUser)
      currentToken = `fake-token-${newUser.id}-${Date.now()}`

      return successResponse({
        user: newUser,
        token: currentToken,
      })
    },

    logout: async () => {
      await delay(API_DELAY)
      currentToken = null
      return successResponse({ message: "Logged out successfully" })
    },
  },

  // Organizations endpoints
  orgs: {
    getAll: async (params) => {
      await delay(API_DELAY)
      const result = paginateAndFilter(db.orgs, params)
      return successResponse(result)
    },

    getById: async (orgId) => {
      await delay(API_DELAY)
      const org = db.orgs.find((o) => o.id === orgId)
      if (!org) throw new Error("Organization not found")
      return successResponse(org)
    },

    create: async (data) => {
      await delay(API_DELAY)
      const newOrg = {
        id: generateId(),
        ...data,
        ownerId: "1", // Current user
        createdAt: now(),
        updatedAt: now(),
      }
      db.orgs.push(newOrg)

      // Add creator as owner member
      db.orgMembers.push({
        id: generateId(),
        orgId: newOrg.id,
        userId: "1",
        role: "owner",
        joinedAt: now(),
      })

      return successResponse(newOrg)
    },

    update: async (orgId, data) => {
      await delay(API_DELAY)
      const index = db.orgs.findIndex((o) => o.id === orgId)
      if (index === -1) throw new Error("Organization not found")

      db.orgs[index] = {
        ...db.orgs[index],
        ...data,
        updatedAt: now(),
      }

      return successResponse(db.orgs[index])
    },

    delete: async (orgId) => {
      await delay(API_DELAY)
      const index = db.orgs.findIndex((o) => o.id === orgId)
      if (index === -1) throw new Error("Organization not found")

      db.orgs.splice(index, 1)
      return successResponse({ message: "Organization deleted" })
    },

    getMembers: async (orgId) => {
      await delay(API_DELAY)
      const members = db.orgMembers.filter((m) => m.orgId === orgId)
      const membersWithUsers = members.map((m) => {
        const user = db.users.find((u) => u.id === m.userId)
        return { ...m, user }
      })
      return successResponse({ items: membersWithUsers, meta: { total: membersWithUsers.length } })
    },
  },

  // Sessions endpoints
  sessions: {
    getAll: async (orgId, params) => {
      await delay(API_DELAY)
      const orgSessions = db.sessions.filter((s) => s.orgId === orgId)
      const result = paginateAndFilter(orgSessions, params)
      return successResponse(result)
    },

    getById: async (sessionId) => {
      await delay(API_DELAY)
      const session = db.sessions.find((s) => s.id === sessionId)
      if (!session) throw new Error("Session not found")

      // Get assignees
      const assignees = db.sessionAssignees
        .filter((a) => a.sessionId === sessionId)
        .map((a) => {
          const user = db.users.find((u) => u.id === a.userId)
          return { ...a, user }
        })

      return successResponse({ ...session, assignees })
    },

    create: async (orgId, data) => {
      await delay(API_DELAY)
      const newSession = {
        id: generateId(),
        orgId,
        ...data,
        status: data.status || "active",
        createdAt: now(),
        updatedAt: now(),
      }
      db.sessions.push(newSession)

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "session",
        entityId: newSession.id,
        userId: "1",
        action: "created",
        changes: { title: newSession.title },
        createdAt: now(),
      })

      return successResponse(newSession)
    },

    update: async (sessionId, data) => {
      await delay(API_DELAY)
      const index = db.sessions.findIndex((s) => s.id === sessionId)
      if (index === -1) throw new Error("Session not found")

      const oldSession = { ...db.sessions[index] }
      db.sessions[index] = {
        ...db.sessions[index],
        ...data,
        updatedAt: now(),
      }

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "session",
        entityId: sessionId,
        userId: "1",
        action: "updated",
        changes: data,
        createdAt: now(),
      })

      return successResponse(db.sessions[index])
    },

    delete: async (sessionId) => {
      await delay(API_DELAY)
      const index = db.sessions.findIndex((s) => s.id === sessionId)
      if (index === -1) throw new Error("Session not found")

      db.sessions.splice(index, 1)
      return successResponse({ message: "Session deleted" })
    },
  },

  // Features endpoints
  features: {
    getAll: async (sessionId, params) => {
      await delay(API_DELAY)
      const sessionFeatures = db.features.filter((f) => f.sessionId === sessionId)
      const result = paginateAndFilter(sessionFeatures, params)
      return successResponse(result)
    },

    getById: async (featureId) => {
      await delay(API_DELAY)
      const feature = db.features.find((f) => f.id === featureId)
      if (!feature) throw new Error("Feature not found")
      return successResponse(feature)
    },

    create: async (sessionId, data) => {
      await delay(API_DELAY)
      const newFeature = {
        id: generateId(),
        sessionId,
        ...data,
        status: data.status || "pending",
        createdAt: now(),
        updatedAt: now(),
      }
      db.features.push(newFeature)

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "feature",
        entityId: newFeature.id,
        userId: "1",
        action: "created",
        changes: { title: newFeature.title },
        createdAt: now(),
      })

      return successResponse(newFeature)
    },

    update: async (featureId, data) => {
      await delay(API_DELAY)
      const index = db.features.findIndex((f) => f.id === featureId)
      if (index === -1) throw new Error("Feature not found")

      db.features[index] = {
        ...db.features[index],
        ...data,
        updatedAt: now(),
      }

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "feature",
        entityId: featureId,
        userId: "1",
        action: "updated",
        changes: data,
        createdAt: now(),
      })

      return successResponse(db.features[index])
    },

    delete: async (featureId) => {
      await delay(API_DELAY)
      const index = db.features.findIndex((f) => f.id === featureId)
      if (index === -1) throw new Error("Feature not found")

      db.features.splice(index, 1)
      return successResponse({ message: "Feature deleted" })
    },
  },

  // Cases endpoints
  cases: {
    getAll: async (featureId, params) => {
      await delay(API_DELAY)
      const featureCases = db.cases.filter((c) => c.featureId === featureId)
      const result = paginateAndFilter(featureCases, params)
      return successResponse(result)
    },

    getById: async (caseId) => {
      await delay(API_DELAY)
      const testCase = db.cases.find((c) => c.id === caseId)
      if (!testCase) throw new Error("Case not found")
      return successResponse(testCase)
    },

    create: async (featureId, data) => {
      await delay(API_DELAY)
      const newCase = {
        id: generateId(),
        featureId,
        ...data,
        status: data.status || "pending",
        createdAt: now(),
        updatedAt: now(),
      }
      db.cases.push(newCase)

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "case",
        entityId: newCase.id,
        userId: "1",
        action: "created",
        changes: { title: newCase.title },
        createdAt: now(),
      })

      return successResponse(newCase)
    },

    update: async (caseId, data) => {
      await delay(API_DELAY)
      const index = db.cases.findIndex((c) => c.id === caseId)
      if (index === -1) throw new Error("Case not found")

      db.cases[index] = {
        ...db.cases[index],
        ...data,
        updatedAt: now(),
      }

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "case",
        entityId: caseId,
        userId: "1",
        action: "updated",
        changes: data,
        createdAt: now(),
      })

      return successResponse(db.cases[index])
    },

    delete: async (caseId) => {
      await delay(API_DELAY)
      const index = db.cases.findIndex((c) => c.id === caseId)
      if (index === -1) throw new Error("Case not found")

      db.cases.splice(index, 1)
      return successResponse({ message: "Case deleted" })
    },
  },

  // Feedback endpoints
  feedback: {
    getAll: async (caseId, params) => {
      await delay(API_DELAY)
      const caseFeedback = db.feedback.filter((f) => f.caseId === caseId)
      const result = paginateAndFilter(caseFeedback, params)

      // Attach user info
      result.items = result.items.map((f) => {
        const user = db.users.find((u) => u.id === f.userId)
        return { ...f, user }
      })

      return successResponse(result)
    },

    create: async (caseId, data) => {
      await delay(API_DELAY)
      const newFeedback = {
        id: generateId(),
        caseId,
        userId: "1", // Current user
        ...data,
        createdAt: now(),
      }
      db.feedback.push(newFeedback)

      // Update case status based on feedback
      const caseIndex = db.cases.findIndex((c) => c.id === caseId)
      if (caseIndex !== -1) {
        db.cases[caseIndex].status = data.result
        db.cases[caseIndex].updatedAt = now()
      }

      // Log to changelog
      db.changelog.push({
        id: generateId(),
        entityType: "feedback",
        entityId: newFeedback.id,
        userId: "1",
        action: "created",
        changes: { result: data.result },
        createdAt: now(),
      })

      return successResponse(newFeedback)
    },

    update: async (feedbackId, data) => {
      await delay(API_DELAY)
      const index = db.feedback.findIndex((f) => f.id === feedbackId)
      if (index === -1) throw new Error("Feedback not found")

      db.feedback[index] = {
        ...db.feedback[index],
        ...data,
      }

      return successResponse(db.feedback[index])
    },

    delete: async (feedbackId) => {
      await delay(API_DELAY)
      const index = db.feedback.findIndex((f) => f.id === feedbackId)
      if (index === -1) throw new Error("Feedback not found")

      db.feedback.splice(index, 1)
      return successResponse({ message: "Feedback deleted" })
    },
  },

  // Changelog endpoints
  changelog: {
    getAll: async (entityType, entityId, params) => {
      await delay(API_DELAY)
      let filtered = db.changelog

      if (entityType && entityId) {
        filtered = filtered.filter((c) => c.entityType === entityType && c.entityId === entityId)
      } else if (entityType) {
        filtered = filtered.filter((c) => c.entityType === entityType)
      }

      // Sort by most recent first
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      const result = paginateAndFilter(filtered, params)

      // Attach user info
      result.items = result.items.map((c) => {
        const user = db.users.find((u) => u.id === c.userId)
        return { ...c, user }
      })

      return successResponse(result)
    },
  },
}

// Export helper to reset database (useful for testing)
export const resetDatabase = () => {
  // Reset to initial state
  db.users = [
    {
      id: "1",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ]
  db.orgs = []
  db.orgMembers = []
  db.sessions = []
  db.sessionAssignees = []
  db.features = []
  db.cases = []
  db.feedback = []
  db.changelog = []
  idCounter = 1000
}
