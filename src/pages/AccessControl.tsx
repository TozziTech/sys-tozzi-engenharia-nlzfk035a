import { useEffect, useState, useMemo } from 'react'
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
import { Shield, Clock, CheckCircle, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function AccessControl() {
  const [users, setUsers] = useState<any[]>([])
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Approval Dialog State
  const [approvalUser, setApprovalUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState('Visitante')
  const [codigo, setCodigo] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activateNow, setActivateNow] = useState(true)

  const loadData = async () => {
    try {
      const records = await pb.collection('users').getFullList({ sort: '-created' })
      setUsers(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())

  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'Pendente'), [users])
  const activeUsers = useMemo(() => users.filter((u) => u.status !== 'Pendente'), [users])

  const handleUpdateUser = async (userId: string, data: any, successMsg: string) => {
    try {
      await pb.collection('users').update(userId, data)
      toast({ title: 'Sucesso', description: successMsg })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar registro.', variant: 'destructive' })
    }
  }

  const handleAdminReset = async (user: any) => {
    try {
      await pb.collection('users').requestPasswordReset(user.email)
      await pb.collection('audit_logs').create({
        user_id: user.id,
        action: 'password_reset_request',
        resource: 'users',
        details: { method: 'admin_reset', triggered_by: currentUser?.id },
      })
      toast({ title: 'Sucesso', description: `Link de redefinição enviado para ${user.email}` })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar link de redefinição.',
        variant: 'destructive',
      })
    }
  }

  const openApproval = (user: any) => {
    setApprovalUser(user)
    setSelectedRole(user.role || 'Visitante')
    setCodigo(user.codigo?.startsWith('TEMP') ? '' : user.codigo || '')
    setTempPassword(Math.random().toString(36).slice(-8) + 'A1!')
    setActivateNow(true)
  }

  const submitApproval = async () => {
    if (!codigo.trim()) {
      toast({ title: 'Erro', description: 'Código é obrigatório.', variant: 'destructive' })
      return
    }
    if (!tempPassword || tempPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'Senha provisória deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmitting(true)
    try {
      await pb.collection('users').update(approvalUser.id, {
        status: activateNow ? 'Ativo' : 'Pendente',
        role: selectedRole,
        codigo: codigo.trim(),
        password: tempPassword,
        passwordConfirm: tempPassword,
        must_change_password: true,
      })
      toast({ title: 'Sucesso', description: 'Usuário aprovado e ativado.' })
      setApprovalUser(null)
      loadData()
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (errors.codigo) {
        toast({
          title: 'Erro',
          description: 'Este código já está em uso por outro usuário.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Erro', description: 'Falha ao aprovar usuário.', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" /> Controle de Acesso
        </h1>
        <p className="text-muted-foreground">
          Gerencie os níveis de acesso e aprovações de novos usuários na plataforma.
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="flex gap-2">
            <CheckCircle className="h-4 w-4" /> Usuários Registrados
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="h-4 w-4" /> Aguardando Aprovação
            {pendingUsers.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  {currentUser?.role === 'Administrador' && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.codigo}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role || 'Visitante'}
                        onValueChange={(val) =>
                          handleUpdateUser(u.id, { role: val }, 'Nível de acesso atualizado.')
                        }
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
                          <SelectItem value="Cliente">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.status || 'Ativo'}
                        onValueChange={(val) =>
                          handleUpdateUser(u.id, { status: val }, 'Status atualizado.')
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Em Férias">Em Férias</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {currentUser?.role === 'Administrador' && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdminReset(u)}
                          title="Enviar link de redefinição de senha"
                        >
                          <KeyRound className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Resetar Senha</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {activeUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={currentUser?.role === 'Administrador' ? 6 : 5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil Solicitado</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{new Date(u.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openApproval(u)}>
                        Aprovar Acesso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum cadastro pendente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!approvalUser} onOpenChange={(open) => !open && setApprovalUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Acesso</DialogTitle>
            <DialogDescription>
              Defina as permissões para o usuário <strong>{approvalUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nível de Acesso (Role)</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                  <SelectItem value="Projetista">Projetista</SelectItem>
                  <SelectItem value="Estagiário">Estagiário</SelectItem>
                  <SelectItem value="Visitante">Visitante</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código do Usuário (Obrigatório e Único)</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: TZZ-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha Provisória</Label>
              <Input
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Senha temporária"
              />
              <p className="text-xs text-muted-foreground">
                O usuário será forçado a alterar esta senha no primeiro login.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="activate" checked={activateNow} onCheckedChange={setActivateNow} />
              <Label htmlFor="activate" className="cursor-pointer">
                Ativar usuário imediatamente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalUser(null)}>
              Cancelar
            </Button>
            <Button onClick={submitApproval} disabled={isSubmitting || !codigo.trim()}>
              {isSubmitting ? 'Salvando...' : 'Aprovar e Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
