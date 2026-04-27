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
  lancamentos_financeiros: 'gestao_financeira',
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

    if (moduleVisibility[moduleId] === false) return 'Inativo'

    const parentId = parentMap[moduleId]
    if (parentId && moduleVisibility[parentId] === false) return 'Inativo'

    // Prioritize Custom Role if assigned
    if (user.custom_role && customRoles[user.custom_role]) {
      const cr = customRoles[user.custom_role]
      const crPerms = cr.permissions || {}
      if (parentId && crPerms[parentId] === 'Inativo') return 'Inativo'
      if (crPerms[moduleId]) {
        return crPerms[moduleId]
      }
    }

    const rolePerms = role_permissions?.[user.role || '']
    if (rolePerms) {
      if (parentId && rolePerms[parentId] === 'Inativo') return 'Inativo'
      if (rolePerms[moduleId]) {
        return rolePerms[moduleId]
      }
    }

    // Deny by default if not configured explicitly
    return 'Inativo'
  }

  const canAccess = (moduleId: string) => getPermission(moduleId) !== 'Inativo'
  const canWrite = (moduleId: string) => getPermission(moduleId) === 'Ativo'

  const can = (action: 'view' | 'create' | 'edit' | 'delete', resource: string) => {
    if (!user) return false
    if (user.role === 'Administrador') return true

    const permKey = `${resource}.${action}`

    if (user.custom_role && customRoles[user.custom_role]) {
      const cr = customRoles[user.custom_role]
      const crPerms = cr.permissions || {}
      if (crPerms[permKey] !== undefined) {
        return crPerms[permKey] === true
      }
    }

    const rolePerms = role_permissions?.[user.role || '']
    if (rolePerms && rolePerms[permKey] !== undefined) {
      return rolePerms[permKey] === true
    }

    // Deny by default
    return false
  }

  return { getPermission, canAccess, canWrite, can }
}
