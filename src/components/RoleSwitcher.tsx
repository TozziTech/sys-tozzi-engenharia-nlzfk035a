import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function RoleSwitcher({ className }: { className?: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  if (user.role !== 'Administrador') {
    return (
      <div
        className={cn(
          'px-3 py-2 text-sm font-medium text-muted-foreground border rounded-md bg-muted/50 whitespace-nowrap',
          className,
        )}
      >
        {user.role}
      </div>
    )
  }

  return (
    <Select
      defaultValue={user.role}
      onValueChange={(val) => {
        if (val === 'Projetista' || val === 'Estagiário') navigate('/designer-panel')
        else if (val === 'Cliente' || val === 'Visitante') navigate('/client-dashboard')
        else navigate('/dashboard')
      }}
    >
      <SelectTrigger className={cn('w-[180px]', className)}>
        <SelectValue placeholder="Selecione a visão" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Administrador">Administrador</SelectItem>
        <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
        <SelectItem value="Projetista">Projetista</SelectItem>
        <SelectItem value="Cliente">Cliente</SelectItem>
      </SelectContent>
    </Select>
  )
}
