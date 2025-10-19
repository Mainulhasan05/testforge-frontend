"use client"

import { usePathname } from "next/navigation"
import { useSelector } from "react-redux"

/**
 * Hook to generate dynamic breadcrumbs based on current route and Redux state
 * @param {Array} customCrumbs - Optional custom breadcrumb items to override defaults
 * @returns {Array} Array of breadcrumb items with label and href
 */
export function useBreadcrumbs(customCrumbs = null) {
  const pathname = usePathname()
  const { currentOrg } = useSelector((state) => state.orgs)
  const { currentSession } = useSelector((state) => state.sessions)
  const { currentFeature } = useSelector((state) => state.features)
  const { currentCase } = useSelector((state) => state.cases)

  // If custom breadcrumbs provided, use them
  if (customCrumbs) {
    return [{ label: "Home", href: "/" }, ...customCrumbs]
  }

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = [{ label: "Home", href: "/" }]

  // Build breadcrumbs based on route segments
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const path = "/" + segments.slice(0, i + 1).join("/")

    // Check if segment is a dynamic ID (UUID pattern or MongoDB ObjectId pattern)
    const isId = /^[a-f0-9]{24}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (isId) {
      // Try to get the name from Redux state based on previous segment
      const prevSegment = segments[i - 1]
      let label = segment.slice(0, 8) + "..." // fallback to truncated ID

      if (prevSegment === "orgs" && currentOrg && currentOrg._id === segment) {
        label = currentOrg.name
      } else if (prevSegment === "sessions" && currentSession && currentSession._id === segment) {
        label = currentSession.title
      } else if (prevSegment === "features" && currentFeature && currentFeature._id === segment) {
        // For features, build proper hierarchy: Org > Session > Feature
        label = currentFeature.title

        // If we have session and org data, rebuild breadcrumbs with proper hierarchy
        if (currentFeature.sessionId) {
          const session = currentFeature.sessionId
          const org = session.orgId

          // Clear previous breadcrumbs and rebuild with hierarchy
          breadcrumbs.length = 1 // Keep only Home

          if (org && org._id) {
            breadcrumbs.push({
              label: org.name,
              href: `/orgs/${org._id}`
            })
          }

          if (session._id) {
            breadcrumbs.push({
              label: session.title,
              href: `/sessions/${session._id}`
            })
          }
        }
      } else if (prevSegment === "cases" && currentCase && currentCase._id === segment) {
        // For cases, build proper hierarchy: Org > Session > Feature > Case
        label = currentCase.title

        // If we have feature, session, and org data, rebuild breadcrumbs with proper hierarchy
        if (currentCase.featureId) {
          const feature = currentCase.featureId

          breadcrumbs.length = 1 // Keep only Home

          if (feature.sessionId) {
            const session = feature.sessionId
            const org = session.orgId

            if (org && org._id) {
              breadcrumbs.push({
                label: org.name,
                href: `/orgs/${org._id}`
              })
            }

            if (session._id) {
              breadcrumbs.push({
                label: session.title,
                href: `/sessions/${session._id}`
              })
            }
          }

          if (feature._id) {
            breadcrumbs.push({
              label: feature.title,
              href: `/features/${feature._id}`
            })
          }
        }
      }

      breadcrumbs.push({ label, href: path })
    } else {
      // Skip adding "features" and "cases" as standalone breadcrumbs since they don't have their own pages
      if (segment === "features" || segment === "cases") {
        continue
      }

      // Convert segment to readable label
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      breadcrumbs.push({ label, href: path })
    }
  }

  return breadcrumbs
}
