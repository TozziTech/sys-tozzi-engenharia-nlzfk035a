import { create } from 'zustand'

interface SettingsStore {
  realtimeEnabled: boolean
  toggleRealtime: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  realtimeEnabled: true,
  toggleRealtime: (enabled) => set({ realtimeEnabled: enabled }),
}))
