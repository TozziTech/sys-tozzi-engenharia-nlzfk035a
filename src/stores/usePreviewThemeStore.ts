import { create } from 'zustand'

interface PreviewThemeStore {
  previewPrimary: string | null
  previewBg: string | null
  setPreviewPrimary: (color: string | null) => void
  setPreviewBg: (color: string | null) => void
}

const usePreviewThemeStore = create<PreviewThemeStore>((set) => ({
  previewPrimary: null,
  previewBg: null,
  setPreviewPrimary: (color) => set({ previewPrimary: color }),
  setPreviewBg: (color) => set({ previewBg: color }),
}))

export default usePreviewThemeStore
