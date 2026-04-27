import { useEffect, useCallback, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'

const parentMap: Record<string, string> = {
  biblioteca: 'gestao_arq_doc',
  pops: 'gestao_arq_doc',
  projetos_base: 'gestao_arq_doc',
  documentos_modelos: 'gestao_arq_doc',
  cursos: 'gestao_arq_doc',
  dashboard_geral: 'gestao_projetos',
  projetos: 'gestao_projetos',
  painel_cliente: 'gestao_projetos',
  diagnostico: 'gestao_projetos',
  performance: 'gestao_projetos',
  cronograma: 'gestao_projetos',
  auditoria_prazos: 'gestao_projetos',
  calendario: 'gestao_projetos',
  dashboard_financeiro: 'gestao_financeira',
  lancamentos_financeiros: 'gestao_financeira',
  planilha_financeira: 'gestao_financeira',
  orcamentos: 'gestao_financeira',
  contratos: 'gestao_financeira',
  contas_bancarias: 'gestao_financeira',
  projetistas: 'cadastro',
  clientes: 'cadastro',
  contatos: 'cadastro',
  equipamentos: 'cadastro',
  controle_acesso: 'governanca',
  visao_carteira: 'governanca',
  dashboard_executivo: 'governanca',
  meu_perfil: 'governanca',
  configuracoes: 'governanca',
  auditoria: 'governanca',
}

const resourceToModuleMap: Record<string, string> = {
  projects: 'projetos',
  tasks: 'projetos',
  finance: 'lancamentos_financeiros',
  financeiro: 'lancamentos_financeiros',
  planilha_financeira: 'planilha_financeira',
  lancamentos_financeiros: 'lancamentos_financeiros',
  dashboard_financeiro: 'dashboard_financeiro',
  quotes: 'orcamentos',
  clients: 'clientes',
  contacts: 'contatos',
  settings: 'configuracoes',
  profile: 'meu_perfil',
  dashboard_executivo: 'dashboard_executivo',
}

export function usePermissions() {
  const { user } = useAuth()
  const { moduleVisibility, role_permissions, setRolePermissions, setModuleVisibility } =
    useSettingsStore()
  const [customRoles, setCustomRoles] = useState<Record<string, any>>({})

  const fetchSettings = useCallback(async () => {
    try {
      const res = await pb.collection('company_settings').getFirstListItem('')
      if (res.role_permissions) {
        setRolePermissions(res.role_permissions)
      }
      if (res.module_visibility) {
        setModuleVisibility(res.module_visibility)
      }
    } catch (e) {
      // ignore
    }
  }, [setRolePermissions, setModuleVisibility])

  const fetchCustomRoles = useCallback(async () => {
    try {
      const customRes = await pb.collection('custom_roles').getFullList()
      const crMap: Record<string, any> = {}
      for (const cr of customRes) {
        crMap[cr.id] = cr
      }
      setCustomRoles(crMap)
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchCustomRoles()
  }, [fetchSettings, fetchCustomRoles])

  useRealtime('company_settings', () => {
    fetchSettings()
  })

  useRealtime('custom_roles', () => {
    fetchCustomRoles()
  })

  const getPermission = (moduleId: string) => {
    if (!user) return 'Inativo'
    if (user.role === 'Administrador') return 'Ativo'

    let effModuleId = moduleId
    if (effModuleId === 'finance') effModuleId = 'lancamentos_financeiros'

    const checkVisibility = (id: string) => {
      if (moduleVisibility[id] !== undefined) return moduleVisibility[id]
      return undefined
    }

    const parentId = parentMap[effModuleId]

    const checkRolePerm = (perms: any, id: string) => {
      if (perms[id]) return perms[id]
      return undefined
    }

    // 1. Check explicit granular permission first (prioritizes specific functional permissions)
    let specificPerm: string | undefined = undefined

    if (user.custom_role && customRoles[user.custom_role]) {
      const crPerms = customRoles[user.custom_role].permissions || {}
      specificPerm = checkRolePerm(crPerms, effModuleId)
    }

    if (!specificPerm) {
      const rolePerms = role_permissions?.[user.role || '']
      if (rolePerms) {
        specificPerm = checkRolePerm(rolePerms, effModuleId)
      }
    }

    if (specificPerm) {
      return specificPerm
    }

    // 2. If no specific permission, fallback to visibility checks
    if (checkVisibility(effModuleId) === false) return 'Inativo'
    if (parentId && checkVisibility(parentId) === false) return 'Inativo'

    // 3. Fallback to parent role permissions
    let parentPerm: string | undefined = undefined
    if (parentId) {
      if (user.custom_role && customRoles[user.custom_role]) {
        const crPerms = customRoles[user.custom_role].permissions || {}
        parentPerm = checkRolePerm(crPerms, parentId)
      }
      if (!parentPerm) {
        const rolePerms = role_permissions?.[user.role || '']
        if (rolePerms) {
          parentPerm = checkRolePerm(rolePerms, parentId)
        }
      }
    }

    if (parentPerm) {
      return parentPerm
    }

    // Deny by default if not configured explicitly
    return 'Inativo'
  }

  const canAccess = (moduleId: string) => getPermission(moduleId) !== 'Inativo'
  const canWrite = (moduleId: string) => getPermission(moduleId) === 'Ativo'

  const can = (action: 'view' | 'create' | 'edit' | 'delete', resource: string) => {
    if (!user) return false
    if (user.role === 'Administrador') return true

    let effResource = resource
    if (effResource === 'finance') effResource = 'lancamentos_financeiros'

    const moduleId = resourceToModuleMap[effResource] || effResource
    const modulePerm = getPermission(moduleId)

    if (modulePerm === 'Inativo') return false
    if (modulePerm === 'Leitura' && action !== 'view') return false

    const permKey = `${effResource}.${action}`
    const oldPermKey = `finance.${action}`

    const checkPerm = (perms: any) => {
      if (perms[permKey] !== undefined) return perms[permKey]
      if (perms[oldPermKey] !== undefined) return perms[oldPermKey]
      return undefined
    }

    if (user.custom_role && customRoles[user.custom_role]) {
      const cr = customRoles[user.custom_role]
      const crPerms = cr.permissions || {}
      const p = checkPerm(crPerms)
      if (p !== undefined) {
        return p === true
      }
    }

    const rolePerms = role_permissions?.[user.role || '']
    if (rolePerms) {
      const p = checkPerm(rolePerms)
      if (p !== undefined) {
        return p === true
      }
    }

    if (action === 'view') return true

    // Fallback to module's base permission if granular isn't defined explicitly
    return modulePerm === 'Ativo'
  }

  return { getPermission, canAccess, canWrite, can }
}
