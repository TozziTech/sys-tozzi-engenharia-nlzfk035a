import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { User } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import useProjectStore from '@/stores/useProjectStore'
import { useAuth } from '@/hooks/use-auth'
import { ProjetistaDashboard } from './ProjetistaDashboard'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { maskCPF, maskRG, maskPhone, validateCPF } from '@/lib/utils'
import {
  Edit2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Wallet,
  Briefcase,
  FileText,
  FileDown,
  Info,
  TrendingUp,
  User as UserIcon,
  Trash2,
  Loader2,
  UserCheck,
  UserMinus,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { exportUserPDF } from '@/lib/exportPdf'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart } from 'recharts'
import { cn } from '@/lib/utils'
import { MemberIdentityFields } from './form/MemberIdentityFields'
import { MemberAddressFields } from './form/MemberAddressFields'
import { editMemberFormSchema, EditMemberFormValues } from '@/lib/schemas/member'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ativo':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'Inativo':
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    case 'Em Férias':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    default:
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
  }
}

const mockFinancialData = [
  { month: 'Jan', amount: 4500 },
  { month: 'Fev', amount: 5200 },
  { month: 'Mar', amount: 4800 },
  { month: 'Abr', amount: 6100 },
  { month: 'Mai', amount: 5900 },
  { month: 'Jun', amount: 7200 },
]

export function MemberCard({
  user,
  onUpdate,
  onDelete,
}: {
  user: User
  onUpdate: (user: User) => void
  onDelete?: (id: string) => void
}) {
  const { projects } = useProjectStore()
  const { user: currentUser } = useAuth()
  const userProjects = projects.filter((p) => user.assignedProjects?.includes(p.id))
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleQuickEdit = async (field: 'status' | 'role', value: string) => {
    const u = user as any
    if (u[field] === value) return

    setIsUpdating(true)
    try {
      const updated = await pb.collection('users').update(user.id, { [field]: value })
      onUpdate({ ...user, ...updated })
      toast({
        title: 'Sucesso',
        description:
          field === 'status' && value === 'Ativo'
            ? 'Colaborador reativado com sucesso! O acesso foi restabelecido.'
            : `${field === 'status' ? 'Status' : 'Cargo'} atualizado.`,
      })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleExportPDF = async () => {
    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(
      '<div style="font-family: sans-serif; padding: 20px; text-align: center;">Gerando relatório...</div>',
    )
    try {
      const settingsList = await pb.collection('company_settings').getFullList()
      exportUserPDF(user, userProjects, settingsList[0], pw)
    } catch (e) {
      exportUserPDF(user, userProjects, null, pw)
    }
  }

  const u = user as any
  let addrStr = ''
  if (u.logradouro) {
    addrStr += u.logradouro
    if (u.numero) addrStr += `, ${u.numero}`
    if (u.bairro) addrStr += ` - ${u.bairro}`
    if (u.cidade) addrStr += `, ${u.cidade}`
    if (u.uf) addrStr += ` - ${u.uf}`
    if (u.cep) addrStr += ` (CEP: ${u.cep})`
  } else {
    addrStr = user.address || 'Não informado'
  }

  const formacaoDisplay = u.formacao || user.specialty || 'Sem Formação'

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/40 bg-card rounded-2xl group relative',
        u.status === 'Inativo' && 'opacity-70 grayscale',
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-6 sm:p-8 flex-1 flex flex-col">
        {/* Name and Formação - Primary Block */}
        <div className="mb-5">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-left w-full group/title mb-1.5 focus:outline-none rounded-md focus-visible:ring-2 focus-visible:ring-ring">
                <h3 className="text-2xl font-bold leading-tight text-foreground group-hover/title:text-primary transition-colors">
                  {user.name}
                </h3>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
              <div className="p-6 pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 shrink-0">
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                    {u.codigo && (
                      <Badge
                        variant="default"
                        className="text-sm px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20"
                      >
                        {u.codigo}
                      </Badge>
                    )}
                    <span>{user.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-2 text-xs font-semibold border shrink-0',
                        getStatusColor(u.status || 'Ativo'),
                      )}
                    >
                      {u.status || 'Ativo'}
                    </Badge>
                  </DialogTitle>{' '}
                  <DialogDescription className="text-base font-medium text-primary mt-1 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> {formacaoDisplay}
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0 bg-background"
                  onClick={handleExportPDF}
                >
                  <FileDown className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pb-8">
                  {/* Contact & Basics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                        <UserIcon className="h-3.5 w-3.5" /> Informações Pessoais
                      </h4>
                      <div className="text-sm space-y-3">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground truncate">
                            {user.email || 'Não informado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground">
                            {user.phone || 'Não informado'}
                          </span>
                        </div>
                        <div className="flex items-start gap-3 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="font-medium text-foreground line-clamp-2">
                            {addrStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground pt-1">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="font-medium text-foreground">
                            CREA: {user.crea || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                        <Wallet className="h-3.5 w-3.5" /> Dados Bancários
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/40">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">
                            Banco
                          </span>
                          <span className="font-medium text-sm">{user.bankData?.bank || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">
                            Agência
                          </span>
                          <span className="font-medium text-sm">
                            {user.bankData?.agency || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">
                            Conta
                          </span>
                          <span className="font-medium text-sm">
                            {user.bankData?.account || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">
                            PIX
                          </span>
                          <span
                            className="font-medium text-sm truncate block"
                            title={user.bankData?.pix}
                          >
                            {user.bankData?.pix || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" /> Projetos Associados
                      </div>
                      <Badge variant="secondary" className="h-5 px-2 text-xs rounded-full">
                        {userProjects.length}
                      </Badge>
                    </h4>
                    {userProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {userProjects.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center bg-muted/10 border border-border/60 p-3 rounded-lg shadow-sm"
                          >
                            <div className="flex flex-col truncate pr-2">
                              <span className="font-medium text-sm truncate">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{p.client}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] whitespace-nowrap bg-background"
                            >
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted/10 border border-dashed border-border p-6 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Nenhum projeto associado no momento.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  {u.documents && u.documents.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" /> Documentos Anexados
                        </div>
                        <Badge variant="secondary" className="h-5 px-2 text-xs rounded-full">
                          {u.documents.length}
                        </Badge>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {u.documents.map((doc: string) => (
                          <a
                            key={doc}
                            href={pb.files.getURL(u, doc)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between bg-muted/10 border border-border/60 p-3 rounded-lg shadow-sm hover:bg-muted/30 transition-colors group/doc"
                          >
                            <span className="text-sm font-medium truncate pr-2" title={doc}>
                              {doc}
                            </span>
                            <FileDown className="h-4 w-4 text-muted-foreground group-hover/doc:text-primary shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Performance */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5" /> Desempenho Financeiro
                      </h4>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full hover:bg-transparent"
                          >
                            <Info className="h-4 w-4 text-muted-foreground/50 hover:text-foreground transition-colors" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[250px] text-xs">
                          Valores baseados em horas aprovadas multiplicadas pelo valor hora do
                          profissional. Dados ilustrativos no momento.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <ChartContainer
                      config={{ amount: { label: 'Recebido', color: 'hsl(var(--primary))' } }}
                      className="h-[150px] w-full"
                    >
                      <BarChart
                        data={mockFinancialData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <ChartTooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--color-amount)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  {/* Dashboard */}
                  <div className="pt-4">
                    <ProjetistaDashboard user={user} />
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <p className="text-base font-medium text-muted-foreground flex items-center gap-2 mt-1.5">
            <Briefcase className="h-5 w-5 text-primary/60 shrink-0" />
            <span>{formacaoDisplay}</span>
          </p>
        </div>

        {/* Meta Data Badges - Secondary Block */}
        <div className="flex items-start mb-6">
          <div
            className={cn(
              'flex flex-wrap items-center gap-2 sm:gap-3 transition-opacity duration-200 w-full',
              isUpdating && 'opacity-50 pointer-events-none',
            )}
          >
            <Badge
              variant="secondary"
              className="font-mono text-xs px-2.5 py-0.5 bg-primary/10 text-primary border-primary/10 rounded-md shadow-sm shrink-0"
            >
              {u.codigo || 'S/N'}
            </Badge>

            <Select
              value={u.status || 'Ativo'}
              onValueChange={(val) => handleQuickEdit('status', val)}
              disabled={currentUser?.role !== 'Administrador'}
            >
              <SelectTrigger
                className={cn(
                  'h-auto px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md border w-fit focus:ring-0 focus:ring-offset-0 [&>svg]:hidden shrink-0 shadow-none',
                  getStatusColor(u.status),
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Em Férias">Em Férias</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contact and Projects */}
        <div className="mb-2 flex-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-base text-muted-foreground/80">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{user.email || 'Email não informado'}</span>
            </div>
            <div className="flex items-center justify-between text-base mt-1">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground/60" />
                <span>
                  <strong className="font-semibold text-foreground">{userProjects.length}</strong>{' '}
                  Projetos
                </span>
              </div>
              {user.crea && (
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground border-border/40 rounded-md bg-muted/20 px-2.5 py-0.5"
                >
                  CREA:{' '}
                  <span className="ml-1" title={user.crea}>
                    {user.crea}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-border/40">
          <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
              onClick={handleExportPDF}
              title="Exportar Relatório PDF"
            >
              <FileDown className="h-5 w-5" />
            </Button>
            <StatusHistoryDialog user={user} />
            <Link to={`/team/${user.id}/edit`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                title="Editar Membro"
              >
                <Edit2 className="h-5 w-5" />
              </Button>
            </Link>
            {u.status === 'Inativo' ? (
              <>
                {currentUser?.role === 'Administrador' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 shrink-0"
                    onClick={() => handleQuickEdit('status', 'Ativo')}
                    title="Reativar Membro"
                  >
                    <UserCheck className="h-5 w-5" />
                  </Button>
                )}
                {onDelete && currentUser?.role === 'Administrador' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      title="Excluir Permanentemente"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Membro Permanentemente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {user.name} da equipe em definitivo?
                            Todos os vínculos em tarefas, registros financeiros e logs podem ser
                            perdidos ou desassociados. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(user.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Excluir Definitivamente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </>
            ) : (
              <>
                {currentUser?.role === 'Administrador' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    title="Desativar Membro"
                  >
                    <UserMinus className="h-5 w-5" />
                  </Button>
                )}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desativar Membro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja desativar {user.name}? O membro será ocultado das
                        listagens ativas e não poderá acessar o sistema, mas todo o histórico de
                        tarefas e registros financeiros será preservado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleQuickEdit('status', 'Inativo')
                          setIsDeleteDialogOpen(false)
                        }}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Desativar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusHistoryDialog({ user }: { user: User }) {
  const [logs, setLogs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const { user: currentUser } = useAuth()

  const loadLogs = async () => {
    try {
      const records = await pb.collection('audit_logs').getFullList({
        filter: `resource = "users" && action = "Alteração de Status"`,
        sort: '-created',
        expand: 'user_id',
      })
      const userLogs = records.filter((r) => r.details?.collaborator_id === user.id)
      setLogs(userLogs)
    } catch (error) {
      console.error('Failed to load status logs:', error)
    }
  }

  useEffect(() => {
    if (open) loadLogs()
  }, [open, user.id])

  if (currentUser?.role !== 'Administrador') return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
          title="Log de Alterações de Status"
        >
          <History className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Log de Alterações de Status
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum histórico de alteração de status encontrado.
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(log.created), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {log.expand?.user_id?.name || 'Administrador'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">
                    Status alterado de{' '}
                    <strong className="text-destructive font-semibold">
                      {log.details?.old_status}
                    </strong>{' '}
                    para{' '}
                    <strong className="text-emerald-600 font-semibold">
                      {log.details?.new_status}
                    </strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
function MemberEditDialog({ user, onSave, open, onOpenChange }: any) {
  const { projects } = useProjectStore()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || [])
  const [existingDocs, setExistingDocs] = useState<string[]>((user as any).documents || [])

  const initialFormacao = (user as any).formacao || user.specialty || ''
  const predefined = [
    'Engenheiro Civil',
    'Engenheiro Elétrico',
    'Engenheiro Mecânico',
    'Arquiteto',
    'Topógrafo',
  ]
  const isPredefined = predefined.includes(initialFormacao)

  const form = useForm<EditMemberFormValues>({
    resolver: zodResolver(editMemberFormSchema),
    defaultValues: {
      name: user.name || '',
      codigo: (user as any).codigo || '',
      role: (user as any).role || 'Projetista',
      status: (user as any).status || 'Ativo',
      crea: (user as any).crea || '',
      formacaoSelect: initialFormacao
        ? isPredefined
          ? initialFormacao
          : 'Outros'
        : 'Engenheiro Civil',
      formacaoCustom: !isPredefined && initialFormacao ? initialFormacao : '',
      email: user.email || '',
      phone: user.phone || '',
      altPhone: (user as any).altPhone || '',
      logradouro: (user as any).logradouro || '',
      numero: (user as any).numero || '',
      bairro: (user as any).bairro || '',
      cidade: (user as any).cidade || '',
      uf: (user as any).uf || '',
      cep: (user as any).cep || '',
      cpf: (user as any).cpf || '',
      rg: (user as any).rg || '',
      birth_date: (user as any).birth_date || '',
      bank_bank: (user as any).bankData?.bank || '',
      bank_agency: (user as any).bankData?.agency || '',
      bank_account: (user as any).bankData?.account || '',
      bank_pix: (user as any).bankData?.pix || '',
      documentos_link: (user as any).documentos_link || '',
      notes: (user as any).notes || '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name || '',
        codigo: (user as any).codigo || '',
        role: (user as any).role || 'Projetista',
        status: (user as any).status || 'Ativo',
        crea: (user as any).crea || '',
        formacaoSelect: initialFormacao
          ? isPredefined
            ? initialFormacao
            : 'Outros'
          : 'Engenheiro Civil',
        formacaoCustom: !isPredefined && initialFormacao ? initialFormacao : '',
        email: user.email || '',
        phone: user.phone || '',
        altPhone: (user as any).altPhone || '',
        logradouro: (user as any).logradouro || '',
        numero: (user as any).numero || '',
        bairro: (user as any).bairro || '',
        cidade: (user as any).cidade || '',
        uf: (user as any).uf || '',
        cep: (user as any).cep || '',
        cpf: (user as any).cpf || '',
        rg: (user as any).rg || '',
        birth_date: (user as any).birth_date || '',
        bank_bank: (user as any).bankData?.bank || '',
        bank_agency: (user as any).bankData?.agency || '',
        bank_account: (user as any).bankData?.account || '',
        bank_pix: (user as any).bankData?.pix || '',
        documentos_link: (user as any).documentos_link || '',
        notes: (user as any).notes || '',
      })
      setSelectedProjects(user.assignedProjects || [])
      setExistingDocs((user as any).documents || [])
    }
  }, [open, user, form, initialFormacao, isPredefined])

  const handleRemoveDoc = async (fileName: string) => {
    if (!confirm('Deseja remover este documento?')) return
    try {
      const updated = await pb.collection('users').update(user.id, {
        'documents-': fileName,
      })
      setExistingDocs(updated.documents || [])
      onSave({ ...user, documents: updated.documents })
      toast({ title: 'Sucesso', description: 'Documento removido com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const onSubmit = async (data: EditMemberFormValues) => {
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

    setLoading(true)
    try {
      const updateData: any = {
        codigo: data.codigo,
        formacao: finalFormacao,
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        cep: data.cep,
        name: data.name,
        phone: data.phone,
        altPhone: data.altPhone,
        crea: data.crea,
        cpf: data.cpf,
        rg: data.rg,
        email: data.email,
        status: data.status,
        role: data.role,
        birth_date: data.birth_date,
        documentos_link: data.documentos_link,
        notes: data.notes,
      }

      let resUser
      if (data.documents && data.documents.length > 0) {
        const formData = new FormData()
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string)
          }
        }
        for (let i = 0; i < data.documents.length; i++) {
          formData.append('documents', data.documents[i])
        }
        resUser = await pb.collection('users').update(user.id, formData)
      } else {
        resUser = await pb.collection('users').update(user.id, updateData)
      }

      const updatedUser = {
        ...user,
        ...data,
        formacao: finalFormacao,
        specialty: finalFormacao,
        assignedProjects: selectedProjects,
        bankData: {
          bank: data.bank_bank,
          agency: data.bank_agency,
          account: data.bank_account,
          pix: data.bank_pix,
        },
        documents: resUser.documents,
      }

      toast({ title: 'Sucesso', description: 'Membro atualizado com sucesso.' })
      onSave(updatedUser)
      onOpenChange(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      let hasFieldError = false

      if (
        fieldErrors.email ||
        err.response?.data?.email?.code === 'validation_invalid_email' ||
        err.response?.data?.email?.code === 'validation_not_unique'
      ) {
        form.setError('email', {
          type: 'manual',
          message: 'Este e-mail já está cadastrado ou é inválido.',
        })
        hasFieldError = true
      }
      if (fieldErrors.codigo || err.response?.data?.codigo?.code === 'validation_not_unique') {
        form.setError('codigo', { type: 'manual', message: 'Este código já está em uso.' })
        hasFieldError = true
      }

      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key !== 'codigo' && key !== 'email' && key in data) {
          form.setError(key as keyof EditMemberFormValues, {
            type: 'manual',
            message: msg as string,
          })
          hasFieldError = true
        }
      }

      if (!hasFieldError || fieldErrors.codigo || fieldErrors.email) {
        const errorMsg = getErrorMessage(err)
        const isDuplicate =
          err.status === 400 &&
          (fieldErrors.codigo ||
            fieldErrors.email ||
            errorMsg.toLowerCase().includes('failed to update') ||
            errorMsg.toLowerCase().includes('validation'))

        toast({
          title: 'Erro ao salvar',
          description: isDuplicate
            ? 'Verifique os dados: Este e-mail ou código já está em uso.'
            : errorMsg,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
        >
          <Edit2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 bg-muted/10 border-b border-border/50 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Perfil do Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações, permissões e acessos de {user.name}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 bg-muted/10 shrink-0">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-10 mb-[-1px] rounded-b-none border border-b-0 border-border/50">
                  <TabsTrigger
                    value="personal"
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background"
                  >
                    Pessoal
                  </TabsTrigger>
                  <TabsTrigger
                    value="professional"
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background"
                  >
                    Profissional
                  </TabsTrigger>
                  <TabsTrigger
                    value="projects"
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background"
                  >
                    Acessos
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 mt-6">
                <TabsContent value="personal" className="space-y-4 m-0 pb-6">
                  <MemberIdentityFields form={form} isEdit user={user} />

                  <div className="pt-4 border-t border-border/50 mt-6">
                    <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> Endereço
                    </h4>
                    <MemberAddressFields form={form} />
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-6">
                    <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Documentos
                    </h4>

                    {existingDocs.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Documentos Anexados
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {existingDocs.map((doc) => (
                            <div
                              key={doc}
                              className="flex items-center justify-between p-2 text-sm border rounded-md bg-muted/20"
                            >
                              <a
                                href={pb.files.getURL(user as any, doc)}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate font-medium hover:underline hover:text-primary pr-2"
                              >
                                {doc}
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveDoc(doc)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="documents"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Adicionar Novos Documentos</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Selecione um ou mais arquivos (cópias de CREA, contratos, etc.) para
                            anexar ao perfil.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="space-y-4 m-0 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="formacaoSelect"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Formação</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                              <SelectItem value="Engenheiro Elétrico">
                                Engenheiro Elétrico
                              </SelectItem>
                              <SelectItem value="Engenheiro Mecânico">
                                Engenheiro Mecânico
                              </SelectItem>
                              <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                              <SelectItem value="Topógrafo">Topógrafo</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="crea"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>CREA</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('formacaoSelect') === 'Outros' && (
                    <FormField
                      control={form.control}
                      name="formacaoCustom"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in zoom-in duration-200">
                          <FormLabel>Especifique a Formação</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Sua formação..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="pt-4 border-t border-border/50 mt-6">
                    <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" /> Dados Bancários
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bank_bank"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bank_agency"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Agência</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bank_account"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Conta</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bank_pix"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>PIX</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-6">
                    <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Link de Documentos
                    </h4>
                    <FormField
                      control={form.control}
                      name="documentos_link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link na Nuvem</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://drive.google.com/..."
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4 m-0 pb-6">
                  {currentUser?.role === 'Administrador' && (
                    <>
                      <div className="mb-4">
                        <Label className="text-base font-semibold">Controles de Acesso</Label>
                        <p className="text-sm text-muted-foreground">
                          Gerencie o nível de permissão e o status da conta deste membro.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-border/50 mb-6">
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Nível de Acesso</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Administrador">Administrador</SelectItem>
                                  <SelectItem value="Gerente de Projeto">
                                    Gerente de Projeto
                                  </SelectItem>
                                  <SelectItem value="Projetista">Projetista</SelectItem>
                                  <SelectItem value="Estagiário">Estagiário</SelectItem>
                                  <SelectItem value="Visitante">Visitante</SelectItem>
                                  <SelectItem value="Cliente">Cliente</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Ativo">Ativo</SelectItem>
                                  <SelectItem value="Inativo">Inativo</SelectItem>
                                  <SelectItem value="Em Férias">Em Férias</SelectItem>
                                  <SelectItem value="Pendente">Pendente</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  <div className="mb-4">
                    <Label className="text-base font-semibold">Projetos Atribuídos</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione os projetos que este membro pode acessar e registrar horas.
                    </p>
                  </div>
                  <div className="border rounded-lg p-1 bg-muted/10 border-border/60">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <label
                          key={project.id}
                          htmlFor={`proj-${project.id}`}
                          className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                        >
                          <Checkbox
                            id={`proj-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => handleToggleProject(project.id)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none">{project.name}</span>
                            <span className="text-xs text-muted-foreground mt-1.5">
                              {project.client} • {project.status}
                            </span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        Nenhum projeto cadastrado no sistema.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>

              <div className="p-6 pt-4 border-t border-border/50 bg-muted/10 shrink-0">
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
