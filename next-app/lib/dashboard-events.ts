export const DASHBOARD_COUNTS_REFRESH_EVENT = "dashboard-counts:refresh"

export function notifyDashboardCountsChanged() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(DASHBOARD_COUNTS_REFRESH_EVENT))
}
