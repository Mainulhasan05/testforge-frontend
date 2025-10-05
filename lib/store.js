import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import orgsReducer from "./slices/orgsSlice"
import sessionsReducer from "./slices/sessionsSlice"
import featuresReducer from "./slices/featuresSlice"
import casesReducer from "./slices/casesSlice"
import feedbackReducer from "./slices/feedbackSlice"
import changelogReducer from "./slices/changelogSlice"

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      orgs: orgsReducer,
      sessions: sessionsReducer,
      features: featuresReducer,
      cases: casesReducer,
      feedback: feedbackReducer,
      changelog: changelogReducer,
    },
  })
}

export const store = makeStore()
