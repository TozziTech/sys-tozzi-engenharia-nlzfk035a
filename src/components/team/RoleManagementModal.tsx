import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Shield } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export function RoleManagementModal({ users, onUpdate }: { users: any[]; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const roles = ['Administrador', 'Gerente de Projeto', 'Projetista', 'Estagiário', 'Visitante']

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId)
    try {
      await pb.collection('users').update(userId, { role: newRole })
      toast({ title: 'Sucesso', description: 'Nível de acesso atualizado.' })
      onUpdate()
    } catch (error) {
      toast({ title: 'Erro', description: getErrorMessage(error), variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="gap-2 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20 dark:text-indigo-400"
        >
          <Shield className="h-4 w-4" />
          Gerenciar Acessos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 shrink-0 bg-muted/10">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            Usuários e Acessos
          </DialogTitle>
          <DialogDescription>
            Gerencie os níveis de permissão dos membros da equipe. Alterações entram em vigor
            imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-0 relative">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
              <TableRow>
                <TableHead className="pl-6">Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[220px] pr-6">Nível de Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium pl-6">
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      {user.codigo && (
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">
                          {user.codigo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell className="pr-6">
                    <Select
                      value={user.role || ''}
                      onValueChange={(val) => handleRoleChange(user.id, val)}
                      disabled={updatingId === user.id}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sem acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
