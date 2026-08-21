const activities = new Map()

export const setDashboardActivity = (source, activity = {}) => {
  if (activity.dirty || activity.uploading) activities.set(source, activity)
  else activities.delete(source)
  window.dispatchEvent(new CustomEvent('dashboard-activity-change'))
}

export const clearDashboardActivity = (source) => {
  activities.delete(source)
  window.dispatchEvent(new CustomEvent('dashboard-activity-change'))
}

export const isDashboardBusy = () => [...activities.values()].some(
  (activity) => activity.dirty || activity.uploading,
)
