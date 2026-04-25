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

export interface RolePermissions {
  [role: string]: {
    [moduleId: string]: 'Ativo' | 'Leitura' | 'Inativo'
  }
}

interface SettingsStore {
  realtimeEnabled: boolean
  toggleRealtime: (enabled: boolean) => void
  moduleVisibility: ModuleVisibility
  setModuleVisibility: (visibility: ModuleVisibility) => void
  role_permissions: RolePermissions
  setRolePermissions: (permissions: RolePermissions) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  realtimeEnabled: true,
  toggleRealtime: (enabled) => set({ realtimeEnabled: enabled }),
  moduleVisibility: {},
  setModuleVisibility: (visibility) => set({ moduleVisibility: visibility }),
  role_permissions: {},
  setRolePermissions: (permissions) => set({ role_permissions: permissions }),
}))
