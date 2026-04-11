import { useState } from 'react'
import { User } from '@/types/project'
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
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { exportUserPDF } from '@/lib/exportPdf'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart } from 'recharts'

const mockFinancialData = [
  { month: 'Jan', amount: 4500 },
  { month: 'Fev', amount: 5200 },
  { month: 'Mar', amount: 4800 },
  { month: 'Abr', amount: 6100 },
  { month: 'Mai', amount: 5900 },
  { month: 'Jun', amount: 7200 },
]

export function MemberCard({ user, onUpdate }: { user: User; onUpdate: (user: User) => void }) {
  const { projects } = useProjectStore()
  const userProjects = projects.filter((p) => user.assignedProjects?.includes(p.id))
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md border-border/60 group">
      <CardHeader className="flex flex-col pb-4 relative border-b border-border/40">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-xl leading-tight font-bold text-left hover:underline text-primary transition-colors cursor-pointer block w-full truncate">
                  {user.name}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
                <div className="p-6 pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 shrink-0">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{user.name}</DialogTitle>
                    <DialogDescription className="text-base font-medium text-primary mt-1 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> {user.specialty || 'Sem Especialidade'}
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
                          <User className="h-3.5 w-3.5" /> Informações Pessoais
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
                              {user.address || 'Não informado'}
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
                            <span className="font-medium text-sm">
                              {user.bankData?.bank || '-'}
                            </span>
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

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium bg-primary/10 text-primary">
                {user.role || 'Sem Cargo'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <MemberEditDialog
              user={user}
              onSave={onUpdate}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4 space-y-4 bg-card/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate">{user.specialty || 'Sem especialidade'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="truncate">{user.email || 'Email não informado'}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{userProjects.length}</span>{' '}
            {userProjects.length === 1 ? 'Projeto' : 'Projetos'}
          </div>
          <Badge variant="outline" className="text-[10px] bg-background border-border/80">
            {user.crea ? `CREA: ${user.crea}` : 'Sem CREA'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function MemberEditDialog({ user, onSave, open, onOpenChange }: any) {
  const { projects } = useProjectStore()
  const [formData, setFormData] = useState<Partial<User>>(user)
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || [])

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

  const handleSave = () => {
    onSave({ ...user, ...formData, assignedProjects: selectedProjects })
    onOpenChange(false)
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
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
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
              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 m-0 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input
                    value={formData.specialty || ''}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    placeholder="Ex: Engenheiro Civil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CREA</Label>
                  <Input
                    value={formData.crea || ''}
                    onChange={(e) => handleChange('crea', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Hora (R$)</Label>
                  <Input
                    type="number"
                    value={formData.hourlyRate || ''}
                    onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
                  />
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
