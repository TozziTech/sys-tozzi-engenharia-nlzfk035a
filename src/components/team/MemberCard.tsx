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
} from '@/components/ui/form'
import useProjectStore from '@/stores/useProjectStore'
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
} from 'lucide-react'
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
  const userProjects = projects.filter((p) => user.assignedProjects?.includes(p.id))
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/40 bg-card rounded-2xl group relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="font-mono text-[10px] sm:text-xs px-2.5 py-0.5 bg-primary/10 text-primary border-primary/10 rounded-md shadow-sm"
            >
              {u.codigo || 'S/N'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider rounded-md border px-2 py-0.5',
                getStatusColor(u.status),
              )}
            >
              {u.status || 'Ativo'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <MemberEditDialog
              user={user}
              onSave={onUpdate}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
            />
            {onDelete && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Membro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover {user.name} da equipe? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(user.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <div className="mb-6 flex-1">
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-left w-full group/title mb-1.5 focus:outline-none rounded-md focus-visible:ring-2 focus-visible:ring-ring">
                <h3 className="text-xl font-bold leading-tight text-foreground group-hover/title:text-primary transition-colors line-clamp-2">
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
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium text-primary mt-1 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> {formacaoDisplay}
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0 bg-background"
                  onClick={() => exportUserPDF(user, userProjects)}
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
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 line-clamp-1 mt-2">
            <Briefcase className="h-4 w-4 text-primary/60 shrink-0" />
            <span className="truncate">{formacaoDisplay}</span>
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-border/40 space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground/80">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{user.email || 'Email não informado'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <span className="font-semibold text-foreground">{userProjects.length}</span> Projetos
            </div>
            {user.crea && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-muted-foreground border-border/40 rounded-md bg-muted/20"
              >
                CREA:{' '}
                <span className="truncate max-w-[80px] ml-1" title={user.crea}>
                  {user.crea}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const editFormSchema = z
  .object({
    name: z.string().min(1, 'O nome do membro é obrigatório.'),
    codigo: z.string().min(1, 'O código é obrigatório.'),
    role: z.string().default('Projetista'),
    status: z.string().default('Ativo'),
    crea: z.string().optional().default(''),
    formacaoSelect: z.string().default('Engenheiro Civil'),
    formacaoCustom: z.string().optional().default(''),
    email: z.string().email('Email inválido.').min(1, 'O email é obrigatório.'),
    phone: z.string().optional().default(''),
    altPhone: z.string().optional().default(''),
    logradouro: z.string().optional().default(''),
    numero: z.string().optional().default(''),
    bairro: z.string().optional().default(''),
    cidade: z.string().optional().default(''),
    uf: z.string().optional().default(''),
    cep: z.string().optional().default(''),
    cpf: z.string().optional().default(''),
    rg: z.string().optional().default(''),
    birthDate: z.string().optional().default(''),
    bank_bank: z.string().optional().default(''),
    bank_agency: z.string().optional().default(''),
    bank_account: z.string().optional().default(''),
    bank_pix: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.formacaoSelect === 'Outros' && !data.formacaoCustom) return false
      return true
    },
    {
      message: 'Especifique a formação.',
      path: ['formacaoCustom'],
    },
  )
  .refine(
    (data) => {
      if (data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validateCPF(data.cpf)) return false
      return true
    },
    {
      message: 'O CPF informado é inválido.',
      path: ['cpf'],
    },
  )

type EditFormValues = z.infer<typeof editFormSchema>

function MemberEditDialog({ user, onSave, open, onOpenChange }: any) {
  const { projects } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || [])

  const initialFormacao = (user as any).formacao || user.specialty || ''
  const predefined = [
    'Engenheiro Civil',
    'Engenheiro Elétrico',
    'Engenheiro Mecânico',
    'Arquiteto',
    'Topógrafo',
  ]
  const isPredefined = predefined.includes(initialFormacao)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
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
      birthDate: (user as any).birthDate || '',
      bank_bank: (user as any).bankData?.bank || '',
      bank_agency: (user as any).bankData?.agency || '',
      bank_account: (user as any).bankData?.account || '',
      bank_pix: (user as any).bankData?.pix || '',
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
        birthDate: (user as any).birthDate || '',
        bank_bank: (user as any).bankData?.bank || '',
        bank_agency: (user as any).bankData?.agency || '',
        bank_account: (user as any).bankData?.account || '',
        bank_pix: (user as any).bankData?.pix || '',
      })
      setSelectedProjects(user.assignedProjects || [])
    }
  }, [open, user, form, initialFormacao, isPredefined])

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const onSubmit = async (data: EditFormValues) => {
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
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
        crea: data.crea,
        cpf: data.cpf,
        rg: data.rg,
        email: data.email,
        status: data.status,
      })

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
          form.setError(key as keyof EditFormValues, { type: 'manual', message: msg as string })
          hasFieldError = true
        }
      }

      if (!hasFieldError) {
        toast({
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
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
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
        >
          <Edit2 className="h-4 w-4" />
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
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Código</FormLabel>
                          <FormControl>
                            <Input disabled className="bg-muted text-muted-foreground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => field.onChange(maskPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => field.onChange(maskRG(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-6">
                    <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> Endereço
                    </h4>
                    <div className="grid grid-cols-12 gap-4">
                      <FormField
                        control={form.control}
                        name="logradouro"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-8">
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="numero"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-4">
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-5">
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-4">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="uf"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-3">
                            <FormLabel>UF</FormLabel>
                            <FormControl>
                              <Input maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-4">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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

                  <div className="grid grid-cols-2 gap-4">
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Cargo no Sistema</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Administrador">Administrador</SelectItem>
                              <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                              <SelectItem value="Projetista">Projetista</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                </TabsContent>

                <TabsContent value="projects" className="space-y-4 m-0 pb-6">
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
