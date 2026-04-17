import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Shield, Users, ShieldAlert } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const roles = [
  'Administrador',
  'Gerente de Projeto',
  'Projetista',
  'Estagiário',
  'Visitante',
  'Cliente',
]

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useRealtime('users', () => {
    loadUsers()
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId)
    try {
      await pb.collection('users').update(userId, { role: newRole })
      toast({ title: 'Sucesso', description: 'Nível de acesso atualizado com sucesso.' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Falha ao atualizar papel.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" /> Gestão de Usuários
        </h1>
        <p className="text-muted-foreground">
          Gerencie os níveis de acesso e permissões de todos os usuários cadastrados na plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Abaixo estão listados todos os usuários. Altere a coluna Nível de Acesso para modificar
            as permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[250px]">Nível de Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                        {user.status || 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || ''}
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                        disabled={updatingId === user.id}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Sem acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              <div className="flex items-center gap-2">
                                {r === 'Administrador' && (
                                  <ShieldAlert className="h-3 w-3 text-red-500" />
                                )}
                                {r}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
