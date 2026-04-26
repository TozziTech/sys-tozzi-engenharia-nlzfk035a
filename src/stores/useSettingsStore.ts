import { create } from 'zustand'

export interface ModuleVisibility {
  gestao_arq_doc?: boolean
  biblioteca?: boolean
  pops?: boolean
  projetos_base?: boolean
  documentos_modelos?: boolean
  cursos?: boolean
  gestao_projetos?: boolean
  dashboard_geral?: boolean
  projetos?: boolean
  painel_cliente?: boolean
  diagnostico?: boolean
  performance?: boolean
  cronograma?: boolean
  auditoria_prazos?: boolean
  calendario?: boolean
  gestao_financeira?: boolean
  lancamentos_financeiros?: boolean
  orcamentos?: boolean
  contratos?: boolean
  contas_bancarias?: boolean
  cadastro?: boolean
  projetistas?: boolean
  clientes?: boolean
  contatos?: boolean
  equipamentos?: boolean
  governanca?: boolean
  controle_acesso?: boolean
  visao_carteira?: boolean
  configuracoes?: boolean
  auditoria?: boolean
  [key: string]: boolean | undefined
}

export interface RolePermissions {
  [role: string]: {
    [moduleIdOrAction: string]: 'Ativo' | 'Leitura' | 'Inativo' | boolean
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
