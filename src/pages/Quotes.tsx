import { useState, useEffect } from 'react'
import { FileDown, Plus, Search, Pencil, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { QuoteGeneratorModal, type QuoteData } from '@/components/QuoteGeneratorModal'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { exportQuotePDF } from '@/lib/exportPdf'
import { quotesService } from '@/services/quotes'
import { CompanySettingsModal } from '@/components/CompanySettingsModal'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { AlertTriangle } from 'lucide-react'

export default function Quotes() {
  const [quotes, setQuotes] = useState<QuoteData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const { toast } = useToast()
  const { canAccess } = usePermissions()
  const { user } = useAuth()

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' })

  const loadQuotes = async () => {
    try {
      const data = await quotesService.getQuotes()
      setQuotes(data)
    } catch (error) {
      console.error('Failed to load quotes:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as propostas.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [toast])

  useRealtime('quotes', () => {
    loadQuotes()
  })

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Aprovado':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
            Aprovado
          </Badge>
        )
      case 'Enviado':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Enviado</Badge>
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pendente</Badge>
        )
    }
  }

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'Todos' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDownload = async (quote: QuoteData) => {
    let settings = null
    try {
      const records = await pb.collection('company_settings').getFullList()
      if (records.length > 0) settings = records[0]
    } catch (e) {
      console.error(e)
    }

    exportQuotePDF(quote, 'Administrador', settings)
    toast({
      title: 'Download iniciado',
      description: 'O orçamento está sendo baixado em PDF.',
    })
  }

  const totalEmAberto = filteredQuotes
    .filter((q) => q.status === 'Pendente' || q.status === 'Enviado')
    .reduce((sum, q) => sum + (q.value || 0), 0)

  const totalAprovado = filteredQuotes
    .filter((q) => q.status === 'Aprovado')
    .reduce((sum, q) => sum + (q.value || 0), 0)

  const valorTotalEstimado = filteredQuotes.reduce((sum, q) => sum + (q.value || 0), 0)

  const handleDelete = async (id: string) => {
    try {
      await quotesService.deleteQuote(id)
      setQuotes(quotes.filter((q) => q.id !== id))
      toast({
        title: 'Proposta excluída',
        description: 'A proposta foi removida com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a proposta.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async (data: QuoteData) => {
    try {
      const savedData = await quotesService.saveQuote({
        ...data,
        value: data.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
        status: data.status || 'Pendente',
        date: data.date || new Intl.DateTimeFormat('pt-BR').format(new Date()),
      })

      if (data.id) {
        setQuotes(quotes.map((q) => (q.id === savedData.id ? savedData : q)))
        toast({
          title: 'Proposta atualizada',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        setQuotes([savedData, ...quotes])
        toast({ title: 'Proposta criada', description: 'Nova proposta adicionada com sucesso.' })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a proposta.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenEmail = (quote: QuoteData) => {
    setEmailForm({
      to: quote.clientEmail || '',
      subject: `Proposta Comercial: ${quote.projectName} (${quote.id || 'Novo'})`,
      message: `Olá,\n\nSegue em anexo a proposta comercial para o projeto ${quote.projectName}.\n\nFico à disposição para dúvidas.\n\nAtenciosamente,`,
    })
    setIsEmailModalOpen(true)
  }

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${emailForm.to}?subject=${encodeURIComponent(
      emailForm.subject,
    )}&body=${encodeURIComponent(emailForm.message)}`
    window.open(mailtoLink, '_blank')

    toast({
      title: 'Email preparado',
      description: 'O seu cliente de email padrão foi aberto com a mensagem.',
    })
    setIsEmailModalOpen(false)
  }

  const statusChartConfig = {
    Aprovado: { label: 'Aprovado', color: '#10b981' },
    Enviado: { label: 'Enviado', color: '#3b82f6' },
    Pendente: { label: 'Pendente', color: '#f59e0b' },
  }

  const statusData = [
    {
      status: 'Aprovado',
      count: quotes.filter((q) => q.status === 'Aprovado').length,
      fill: 'var(--color-Aprovado)',
    },
    {
      status: 'Enviado',
      count: quotes.filter((q) => q.status === 'Enviado').length,
      fill: 'var(--color-Enviado)',
    },
    {
      status: 'Pendente',
      count: quotes.filter((q) => q.status === 'Pendente').length,
      fill: 'var(--color-Pendente)',
    },
  ].filter((d) => d.count > 0)

  const revenueChartConfig = {
    value: { label: 'Receita (R$)', color: 'hsl(var(--primary))' },
  }

  const revenueDataMap = quotes.reduce(
    (acc, q) => {
      const parts = q.date?.split('/') || []
      if (parts.length === 3) {
        const monthYear = `${parts[1]}/${parts[2]}`
        acc[monthYear] = (acc[monthYear] || 0) + (q.value || 0)
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const revenueData = Object.entries(revenueDataMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => {
      const [m1, y1] = a.date.split('/')
      const [m2, y2] = b.date.split('/')
      return (
        new Date(Number(y1), Number(m1) - 1).getTime() -
        new Date(Number(y2), Number(m2) - 1).getTime()
      )
    })

  if (!canAccess('orcamentos') && user?.role !== 'Administrador') {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 animate-fade-in">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium">Acesso Restrito</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            Você não tem permissão para acessar os Orçamentos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Propostas & Orçamentos</h2>
            <p className="text-muted-foreground">
              Acompanhe e gerencie todas as propostas comerciais enviadas e geradas.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CompanySettingsModal />
          <QuoteGeneratorModal onSave={handleSave}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Proposta
            </Button>
          </QuoteGeneratorModal>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEmAberto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAprovado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalEstimado)}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Visão de Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Proporção por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[250px] w-full">
              {statusData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Volume Financeiro (Mês a Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
              {revenueData.length > 0 ? (
                <BarChart data={revenueData} margin={{ top: 20, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${value >= 1000 ? value / 1000 + 'k' : value}`}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-muted)' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--color-value)" />
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 py-4 mt-6">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou projeto..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Enviado">Enviado</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Carregando propostas...
                </TableCell>
              </TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <p className="text-muted-foreground">Nenhuma proposta encontrada.</p>
                    <QuoteGeneratorModal onSave={handleSave}>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Criar Primeira Proposta
                      </Button>
                    </QuoteGeneratorModal>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{quote.clientName}</span>
                      {quote.clientEmail && (
                        <span className="text-xs text-muted-foreground">{quote.clientEmail}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{quote.projectName}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quote.value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEmail(quote)}
                        title="Enviar por Email"
                      >
                        <Mail className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(quote)}
                        title="Exportar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <QuoteGeneratorModal initialData={quote} onSave={handleSave}>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </QuoteGeneratorModal>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a proposta para{' '}
                              <strong>{quote.clientName}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(quote.id!)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Proposta por Email</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para enviar a proposta diretamente ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Para (Email do Cliente)</Label>
              <Input
                type="email"
                value={emailForm.to}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                placeholder="cliente@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Proposta Comercial"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                className="min-h-[150px] resize-y"
                value={emailForm.message}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Escreva sua mensagem aqui..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
