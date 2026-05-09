import { create } from 'zustand'
import pb from '@/lib/pocketbase/client'

export interface WidgetLayout {
  id: string
  order: number
  colSpan: number
}

export interface ShortcutConfig {
  path: string
  label: string
  key: string
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

interface PreferencesStore {
  density: 'compact' | 'spaced'
  dashboardLayout: WidgetLayout[]
  projectOrder: string[]
  viewMode: 'table' | 'grid'
  shortcuts: Record<string, ShortcutConfig>
  setDensity: (density: 'compact' | 'spaced', userId?: string) => void
  setDashboardLayout: (layout: WidgetLayout[], userId?: string) => void
  setProjectOrder: (order: string[], userId?: string) => void
  setViewMode: (mode: 'table' | 'grid', userId?: string) => void
  setShortcuts: (shortcuts: Record<string, ShortcutConfig>, userId?: string) => void
  loadPreferences: (user: any) => void
}

const defaultLayout: WidgetLayout[] = [
  { id: 'metrics', order: 0, colSpan: 7 },
  { id: 'financial', order: 1, colSpan: 4 },
  { id: 'bottlenecks', order: 2, colSpan: 3 },
  { id: 'progress', order: 3, colSpan: 4 },
  { id: 'activity', order: 4, colSpan: 3 },
]

export const defaultShortcuts: Record<string, ShortcutConfig> = {
  dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    key: 'h',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  apaDashboard: {
    path: '/apa?tab=dashboard',
    label: 'APA Dashboard',
    key: 'a',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  apaNew: {
    path: '/apa?tab=new',
    label: 'Novo APA',
    key: '',
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  checklists: {
    path: '/checklists',
    label: 'Checklists',
    key: 'k',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  meetings: {
    path: '/admin/reunioes',
    label: 'Reuniões',
    key: 'r',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  documents: {
    path: '/files/library',
    label: 'Gestão ARQ/DOC',
    key: 'd',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  projects: {
    path: '/projects',
    label: 'Projetos',
    key: 'p',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  financial: {
    path: '/financial-dashboard',
    label: 'Financeiro',
    key: 'f',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  contacts: {
    path: '/contacts',
    label: 'Contatos',
    key: 'c',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
  deadlineAudit: {
    path: '/deadline-audit',
    label: 'Auditoria de Prazos',
    key: '',
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
  },
}

const getPrefsToSave = (state: PreferencesStore) => ({
  density: state.density,
  dashboardLayout: state.dashboardLayout,
  projectOrder: state.projectOrder,
  viewMode: state.viewMode,
  shortcuts: state.shortcuts,
})

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  density: 'spaced',
  dashboardLayout: defaultLayout,
  projectOrder: [],
  viewMode: 'grid',
  shortcuts: defaultShortcuts,
  setDensity: async (density, userId) => {
    set({ density })
    if (userId) {
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { ...getPrefsToSave(get()), density },
        })
      } catch (e) {
        console.error('Failed to save density', e)
      }
    }
  },
  setDashboardLayout: async (layout, userId) => {
    set({ dashboardLayout: layout })
    if (userId) {
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { ...getPrefsToSave(get()), dashboardLayout: layout },
        })
      } catch (e) {
        console.error('Failed to save layout', e)
      }
    }
  },
  setProjectOrder: async (order, userId) => {
    set({ projectOrder: order })
    if (userId) {
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { ...getPrefsToSave(get()), projectOrder: order },
        })
      } catch (e) {
        console.error('Failed to save project order', e)
      }
    }
  },
  setViewMode: async (mode, userId) => {
    set({ viewMode: mode })
    if (userId) {
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { ...getPrefsToSave(get()), viewMode: mode },
        })
      } catch (e) {
        console.error('Failed to save view mode', e)
      }
    }
  },
  setShortcuts: async (shortcuts, userId) => {
    set({ shortcuts })
    if (userId) {
      try {
        await pb.collection('users').update(userId, {
          ui_preferences: { ...getPrefsToSave(get()), shortcuts },
        })
      } catch (e) {
        console.error('Failed to save shortcuts', e)
      }
    }
  },
  loadPreferences: (user) => {
    if (user?.ui_preferences) {
      const prefs = user.ui_preferences

      const loadedShortcuts = prefs.shortcuts || {}
      const mergedShortcuts: Record<string, ShortcutConfig> = { ...defaultShortcuts }
      for (const k in mergedShortcuts) {
        if (loadedShortcuts[k]) {
          mergedShortcuts[k] = {
            ...mergedShortcuts[k],
            key: loadedShortcuts[k].key,
            altKey: loadedShortcuts[k].altKey,
            ctrlKey: loadedShortcuts[k].ctrlKey,
            shiftKey: loadedShortcuts[k].shiftKey,
            metaKey: loadedShortcuts[k].metaKey,
          }
        }
      }

      set({
        density: prefs.density || 'spaced',
        dashboardLayout: prefs.dashboardLayout || defaultLayout,
        projectOrder: prefs.projectOrder || [],
        viewMode: prefs.viewMode || 'grid',
        shortcuts: mergedShortcuts,
      })
    }
  },
}))
