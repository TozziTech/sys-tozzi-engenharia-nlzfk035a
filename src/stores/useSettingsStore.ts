import { create } from 'zustand'

export interface ModuleVisibility {
  gestao_arq_doc?: boolean
  biblioteca?: boolean
  pops?: boolean
  projetos_base?: boolean
  documentos_modelos?: boolean
  cursos?: boolean
  [key: string]: boolean | undefined
}

interface SettingsStore {
  realtimeEnabled: boolean
  toggleRealtime: (enabled: boolean) => void
  moduleVisibility: ModuleVisibility
  setModuleVisibility: (visibility: ModuleVisibility) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  realtimeEnabled: true,
  toggleRealtime: (enabled) => set({ realtimeEnabled: enabled }),
  moduleVisibility: {},
  setModuleVisibility: (visibility) => set({ moduleVisibility: visibility }),
}))
