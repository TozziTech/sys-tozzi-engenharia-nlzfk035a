import { create } from 'zustand'
import pb from '@/lib/pocketbase/client'

export interface WidgetLayout {
  id: string
  order: number
  colSpan: number
}

interface PreferencesStore {
  density: 'compact' | 'spaced'
  dashboardLayout: WidgetLayout[]
  setDensity: (density: 'compact' | 'spaced', userId?: string) => void
  setDashboardLayout: (layout: WidgetLayout[], userId?: string) => void
  loadPreferences: (user: any) => void
}

const defaultLayout: WidgetLayout[] = [
  { id: 'metrics', order: 0, colSpan: 7 },
  { id: 'financial', order: 1, colSpan: 4 },
  { id: 'bottlenecks', order: 2, colSpan: 3 },
  { id: 'progress', order: 3, colSpan: 4 },
  { id: 'activity', order: 4, colSpan: 3 },
]

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  density: 'spaced',
  dashboardLayout: defaultLayout,
  setDensity: async (density, userId) => {
    set({ density })
    if (userId) {
      const current = get()
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { density, dashboardLayout: current.dashboardLayout },
        })
      } catch (e) {
        console.error('Failed to save density', e)
      }
    }
  },
  setDashboardLayout: async (layout, userId) => {
    set({ dashboardLayout: layout })
    if (userId) {
      const current = get()
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { density: current.density, dashboardLayout: layout },
        })
      } catch (e) {
        console.error('Failed to save layout', e)
      }
    }
  },
  loadPreferences: (user) => {
    if (user?.ui_preferences) {
      const prefs = user.ui_preferences
      set({
        density: prefs.density || 'spaced',
        dashboardLayout: prefs.dashboardLayout || defaultLayout,
      })
    }
  },
}))
