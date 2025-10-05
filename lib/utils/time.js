/**
 * Converts UTC timestamp to local date string
 */
export function formatLocalDate(utcTimestamp) {
  if (!utcTimestamp) return ""
  const date = new Date(utcTimestamp)
  return date.toLocaleDateString()
}

/**
 * Converts UTC timestamp to local date and time string
 */
export function formatLocalDateTime(utcTimestamp) {
  if (!utcTimestamp) return ""
  const date = new Date(utcTimestamp)
  return date.toLocaleString()
}

/**
 * Converts UTC timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(utcTimestamp) {
  if (!utcTimestamp) return ""
  const date = new Date(utcTimestamp)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
  return formatLocalDate(utcTimestamp)
}

/**
 * Gets current UTC timestamp
 */
export function getCurrentUTC() {
  return new Date().toISOString()
}
