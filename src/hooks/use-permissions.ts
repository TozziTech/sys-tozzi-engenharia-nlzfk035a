import { useEffect, useCallback, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'

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

    // Prioritize Custom Role if assigned
    if (user.custom_role && customRoles[user.custom_role]) {
      const cr = customRoles[user.custom_role]
      const crPerms = cr.permissions || {}
      if (crPerms[moduleId]) {
        return crPerms[moduleId]
      }
    }

    const rolePerms = role_permissions?.[user.role || '']
    if (rolePerms && rolePerms[moduleId]) {
      return rolePerms[moduleId]
    }

    return 'Ativo' // fallback to active if not configured explicitly
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

    // Default fallback based on role and action
    if (user.role === 'Gerente de Projeto') return true
    if (action === 'view') return true
    return false
  }

  return { getPermission, canAccess, canWrite, can }
}
