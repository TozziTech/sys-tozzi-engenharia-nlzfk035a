import { useState } from 'react'
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
import useProjectStore from '@/stores/useProjectStore'
import { ProjetistaDashboard } from './ProjetistaDashboard'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
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

function MemberEditDialog({ user, onSave, open, onOpenChange }: any) {
  const { projects } = useProjectStore()
  const [formData, setFormData] = useState<Partial<User> & Record<string, any>>(user)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || [])

  const [formacaoSelect, setFormacaoSelect] = useState(() => {
    const f = (user as any).formacao || user.specialty || ''
    const predefined = [
      'Engenheiro Civil',
      'Engenheiro Elétrico',
      'Engenheiro Mecânico',
      'Arquiteto',
      'Topógrafo',
    ]
    if (!f) return 'Engenheiro Civil'
    if (predefined.includes(f)) return f
    return 'Outros'
  })

  const [formacaoCustom, setFormacaoCustom] = useState(() => {
    const f = (user as any).formacao || user.specialty || ''
    const predefined = [
      'Engenheiro Civil',
      'Engenheiro Elétrico',
      'Engenheiro Mecânico',
      'Arquiteto',
      'Topógrafo',
    ]
    if (f && !predefined.includes(f)) return f
    return ''
  })

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('bank_')) {
      const bankField = field.replace('bank_', '')
      setFormData((prev) => ({
        ...prev,
        bankData: {
          ...(prev.bankData || { bank: '', agency: '', account: '', pix: '' }),
          [bankField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const handleSave = async () => {
    const finalFormacao = formacaoSelect === 'Outros' ? formacaoCustom : formacaoSelect
    const updatedUser = {
      ...user,
      ...formData,
      formacao: finalFormacao,
      specialty: finalFormacao,
      assignedProjects: selectedProjects,
    }

    setLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        codigo: formData.codigo,
        formacao: finalFormacao,
        logradouro: formData.logradouro,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: formData.cep,
        name: formData.name,
        phone: formData.phone,
        crea: formData.crea,
        cpf: formData.cpf,
        rg: formData.rg,
        status: formData.status || 'Ativo',
      })
      toast({ title: 'Sucesso', description: 'Membro atualizado com sucesso.' })
      onSave(updatedUser)
      onOpenChange(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (fieldErrors.email) {
        toast({
          title: 'Email inválido ou já cadastrado',
          description: fieldErrors.email,
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
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
      <DialogContent className="sm:max-w-[550px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 bg-muted/10">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Perfil do Membro</DialogTitle>
            <DialogDescription>
              Atualize as informações, permissões e acessos de {user.name}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border/50 bg-muted/10">
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
                <div className="space-y-2 col-span-3">
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Código</Label>
                  <Input
                    value={formData.codigo || ''}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 mt-6">
                <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Endereço
                </h4>
                <div className="grid grid-cols-12 gap-4">
                  <div className="space-y-2 col-span-12 sm:col-span-8">
                    <Label>Logradouro</Label>
                    <Input
                      value={formData.logradouro || ''}
                      onChange={(e) => handleChange('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-12 sm:col-span-4">
                    <Label>Número</Label>
                    <Input
                      value={formData.numero || ''}
                      onChange={(e) => handleChange('numero', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-12 sm:col-span-5">
                    <Label>Bairro</Label>
                    <Input
                      value={formData.bairro || ''}
                      onChange={(e) => handleChange('bairro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-12 sm:col-span-4">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade || ''}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-12 sm:col-span-3">
                    <Label>UF</Label>
                    <Input
                      value={formData.uf || ''}
                      onChange={(e) => handleChange('uf', e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2 col-span-12 sm:col-span-4">
                    <Label>CEP</Label>
                    <Input
                      value={formData.cep || ''}
                      onChange={(e) => handleChange('cep', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 m-0 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formação</Label>
                  <Select value={formacaoSelect} onValueChange={setFormacaoSelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                      <SelectItem value="Engenheiro Elétrico">Engenheiro Elétrico</SelectItem>
                      <SelectItem value="Engenheiro Mecânico">Engenheiro Mecânico</SelectItem>
                      <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                      <SelectItem value="Topógrafo">Topógrafo</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CREA</Label>
                  <Input
                    value={formData.crea || ''}
                    onChange={(e) => handleChange('crea', e.target.value)}
                  />
                </div>
              </div>

              {formacaoSelect === 'Outros' && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                  <Label>Especifique a Formação</Label>
                  <Input
                    value={formacaoCustom}
                    onChange={(e) => setFormacaoCustom(e.target.value)}
                    placeholder="Sua formação..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status || 'Ativo'}
                    onValueChange={(v) => handleChange('status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Em Férias">Em Férias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cargo no Sistema</Label>
                  <Select
                    value={formData.role || ''}
                    onValueChange={(v) => handleChange('role', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                      <SelectItem value="Projetista">Projetista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 mt-6">
                <h4 className="font-semibold text-sm mb-4 text-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" /> Dados Bancários
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={formData.bankData?.bank || ''}
                      onChange={(e) => handleChange('bank_bank', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input
                      value={formData.bankData?.agency || ''}
                      onChange={(e) => handleChange('bank_agency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input
                      value={formData.bankData?.account || ''}
                      onChange={(e) => handleChange('bank_account', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PIX</Label>
                    <Input
                      value={formData.bankData?.pix || ''}
                      onChange={(e) => handleChange('bank_pix', e.target.value)}
                    />
                  </div>
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
        </Tabs>

        <div className="p-6 pt-4 border-t border-border/50 bg-muted/10">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
