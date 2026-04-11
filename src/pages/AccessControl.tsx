import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
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
import { Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AccessControl() {
  const [users, setUsers] = useState<any[]>([])
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const records = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await pb.collection('users').update(userId, { role: newRole })
      toast({ title: 'Sucesso', description: 'Nível de acesso atualizado.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar acesso.', variant: 'destructive' })
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" /> Controle de Acesso
        </h1>
        <p className="text-muted-foreground">
          Gerencie os níveis de acesso dos usuários na plataforma.
        </p>
      </div>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nível de Acesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.codigo}</TableCell>
                <TableCell>
                  <Select
                    value={u.role || 'Visitante'}
                    onValueChange={(val) => handleRoleChange(u.id, val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                      <SelectItem value="Projetista">Projetista</SelectItem>
                      <SelectItem value="Estagiário">Estagiário</SelectItem>
                      <SelectItem value="Visitante">Visitante</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
