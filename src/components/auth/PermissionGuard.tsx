import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  module: string
  action?: 'read' | 'write'
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  module,
  action = 'read',
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { canAccess, canWrite } = usePermissions()

  if (action === 'write' && !canWrite(module)) return <>{fallback}</>
  if (action === 'read' && !canAccess(module)) return <>{fallback}</>

  return <>{children}</>
}
