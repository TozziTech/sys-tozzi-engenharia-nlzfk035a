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
import { Shield, Users, ShieldAlert, AlertCircle } from 'lucide-react'
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
  const [customRoles, setCustomRoles] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [u, c] = await Promise.all([
        pb.collection('users').getFullList({ sort: 'name', expand: 'custom_role' }),
        pb.collection('custom_roles').getFullList({ sort: 'name' }),
      ])
      setUsers(u)
      setCustomRoles(c)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('users', () => loadData())
  useRealtime('custom_roles', () => loadData())

  const handleRoleChange = async (
    userId: string,
    field: 'role' | 'custom_role',
    newValue: string,
  ) => {
    setUpdatingId(userId)
    try {
      await pb
        .collection('users')
        .update(userId, { [field]: newValue === 'none' ? null : newValue })
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
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
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
            Atribua perfis de sistema e perfis customizados. O Perfil Customizado tem prioridade
            sobre o Perfil do Sistema (exceto para Administradores).
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
                  <TableHead className="w-[200px]">Perfil do Sistema</TableHead>
                  <TableHead className="w-[200px]">Perfil Customizado</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
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
                        onValueChange={(val) => handleRoleChange(user.id, 'role', val)}
                        disabled={updatingId === user.id}
                      >
                        <SelectTrigger
                          className={`h-9 w-full ${user.custom_role && user.role !== 'Administrador' ? 'opacity-50 line-through' : ''}`}
                        >
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
                    <TableCell>
                      <Select
                        value={user.custom_role || 'none'}
                        onValueChange={(val) => handleRoleChange(user.id, 'custom_role', val)}
                        disabled={updatingId === user.id}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {customRoles.map((cr) => (
                            <SelectItem key={cr.id} value={cr.id}>
                              {cr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.custom_role && user.role !== 'Administrador' && (
                        <div
                          className="flex items-center text-xs text-amber-600 font-medium"
                          title="Perfil customizado ativo. Substitui as permissões do perfil de sistema."
                        >
                          <AlertCircle className="h-4 w-4 mr-1" /> Override
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
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
