import { useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'

export function usePermissions() {
  const { user } = useAuth()
  const { moduleVisibility, role_permissions, setRolePermissions, setModuleVisibility } =
    useSettingsStore()

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

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useRealtime('company_settings', () => {
    fetchSettings()
  })

  const getPermission = (moduleId: string) => {
    if (user?.role === 'Administrador') return 'Ativo'

    if (moduleVisibility[moduleId] === false) return 'Inativo'

    if (!user) return 'Inativo'

    const rolePerms = role_permissions?.[user.role]
    if (rolePerms && rolePerms[moduleId]) {
      return rolePerms[moduleId]
    }

    return 'Ativo' // fallback to active if not configured explicitly
  }

  const canAccess = (moduleId: string) => getPermission(moduleId) !== 'Inativo'
  const canWrite = (moduleId: string) => getPermission(moduleId) === 'Ativo'

  return { getPermission, canAccess, canWrite }
}
