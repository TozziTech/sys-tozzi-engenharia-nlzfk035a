import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  History,
  Search,
  Filter,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getChecklistExecutions, getChecklistTemplates } from '@/services/checklists'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ChecklistHistory() {
  const [executions, setExecutions] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [templateFilter, setTemplateFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal
  const [selectedExecution, setSelectedExecution] = useState<any>(null)
  useEffect(() => {
    fetchAuxData()
  }, [])

  useEffect(() => {
    fetchExecutions()
  }, [search, statusFilter, templateFilter, userFilter, startDate, endDate])

  const fetchAuxData = async () => {
    try {
      const [tpls, usrs] = await Promise.all([
        getChecklistTemplates(),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])
      setTemplates(tpls)
      setUsers(usrs)
    } catch (error) {
      console.error('Error fetching aux data', error)
    }
  }

  const fetchExecutions = async () => {
    try {
      setLoading(true)
      const filters = []
      if (search) filters.push(`location ~ "${search}"`)
      if (statusFilter !== 'all') filters.push(`status = "${statusFilter}"`)
      if (templateFilter !== 'all') filters.push(`template = "${templateFilter}"`)
      if (userFilter !== 'all') filters.push(`responsible = "${userFilter}"`)
      if (startDate) filters.push(`inspection_date >= "${startDate} 00:00:00"`)
      if (endDate) filters.push(`inspection_date <= "${endDate} 23:59:59"`)

      const filterString = filters.join(' && ')

      const res = await getChecklistExecutions({
        filter: filterString,
        expand: 'template,responsible',
      })
      setExecutions(res.items)
    } catch (error) {
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePdf = () => {
    if (!selectedExecution) return

    const engName = selectedExecution.expand?.responsible?.name || 'N/A'
    const tplName = selectedExecution.expand?.template?.name || 'N/A'
    const dateFormatted = selectedExecution.inspection_date
      ? format(new Date(selectedExecution.inspection_date), 'dd/MM/yyyy')
      : 'N/A'
    const score = selectedExecution.compliance_score || 0

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Checklist - ${selectedExecution.location}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
            .header-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .header-info div { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f9fafb; }
            .checked { color: #10b981; font-weight: bold; }
            .unchecked { color: #ef4444; font-weight: bold; }
            .score { font-size: 24px; font-weight: bold; margin-top: 20px; color: #f59e0b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Checklist</h1>
          <div class="header-info">
            <div><strong>Data:</strong> ${dateFormatted}</div>
            <div><strong>Local:</strong> ${selectedExecution.location}</div>
            <div><strong>Responsável:</strong> ${engName}</div>
            <div><strong>Modelo:</strong> ${tplName}</div>
          </div>
          
          <div class="score">Conformidade: ${score}%</div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 80px; text-align: center;">Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedExecution.responses || [])
                .map(
                  (r: any) => `
                <tr>
                  <td>${r.itemName}</td>
                  <td style="text-align: center;" class="${r.checked ? 'checked' : 'unchecked'}">${r.checked ? 'SIM' : 'NÃO'}</td>
                  <td>${r.notes || '-'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="flex-1 space-y-4">
      <Card className="border-amber-500/20 bg-background/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 border-b border-amber-500/10">
          <CardTitle className="text-amber-500 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center relative">
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 border-amber-500/30 focus-visible:ring-amber-500"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[140px] border-amber-500/30 focus-visible:ring-amber-500"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[140px] border-amber-500/30 focus-visible:ring-amber-500"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-amber-500/30 focus:ring-amber-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-[180px] border-amber-500/30 focus:ring-amber-500">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Modelos</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px] border-amber-500/30 focus:ring-amber-500">
                <SelectValue placeholder="Engenheiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Engenheiros</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-amber-500/20">
                <TableHead>Data</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Engenheiro</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Itens Levados</TableHead>
                <TableHead className="text-right">% Conformidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                  </TableCell>
                </TableRow>
              ) : executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum checklist encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((exec) => {
                  const responses = Array.isArray(exec.responses) ? exec.responses : []
                  const total = responses.length
                  const checked = responses.filter((r: any) => r.checked).length
                  const dateFormatted = exec.inspection_date
                    ? format(new Date(exec.inspection_date), 'dd/MM/yyyy')
                    : 'N/A'
                  const engName = exec.expand?.responsible?.name || 'N/A'
                  const tplName = exec.expand?.template?.name || 'N/A'

                  return (
                    <TableRow
                      key={exec.id}
                      className="cursor-pointer hover:bg-amber-500/5 transition-colors border-amber-500/10"
                      onClick={() => setSelectedExecution(exec)}
                    >
                      <TableCell className="font-medium">{dateFormatted}</TableCell>
                      <TableCell>{exec.location}</TableCell>
                      <TableCell>{engName}</TableCell>
                      <TableCell>{tplName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            exec.status === 'concluído'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                          )}
                        >
                          {exec.status === 'concluído' ? 'Concluído' : 'Em Andamento'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {checked}/{total}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'font-bold',
                            exec.compliance_score >= 80
                              ? 'text-emerald-500'
                              : exec.compliance_score >= 50
                                ? 'text-amber-500'
                                : 'text-red-500',
                          )}
                        >
                          {exec.compliance_score || 0}%
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedExecution}
        onOpenChange={(open) => !open && setSelectedExecution(null)}
      >
        <DialogContent className="max-w-4xl border-amber-500/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="border-b border-amber-500/10 pb-4">
            <DialogTitle className="text-2xl text-amber-500 flex items-center gap-2">
              <FileCheck className="h-6 w-6" />
              Detalhes da Inspeção
            </DialogTitle>
            <DialogDescription>
              {selectedExecution?.location} -{' '}
              {selectedExecution?.inspection_date &&
                format(new Date(selectedExecution.inspection_date), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg border border-amber-500/10">
                  <div className="text-xs text-muted-foreground">Engenheiro Responsável</div>
                  <div className="font-semibold">
                    {selectedExecution.expand?.responsible?.name || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-amber-500/10">
                  <div className="text-xs text-muted-foreground">Modelo Utilizado</div>
                  <div className="font-semibold">
                    {selectedExecution.expand?.template?.name || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-amber-500/10">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-semibold capitalize">
                    {selectedExecution.status?.replace('_', ' ') || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="border border-amber-500/20 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-amber-500/5">
                    <TableRow>
                      <TableHead>Item do Checklist</TableHead>
                      <TableHead className="w-[100px] text-center">Levou?</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedExecution.responses || []).map((resp: any, i: number) => (
                      <TableRow key={i} className="border-amber-500/10">
                        <TableCell className="font-medium">{resp.itemName}</TableCell>
                        <TableCell className="text-center">
                          {resp.checked ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {resp.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total de Itens: </span>
                    <span className="font-bold">{(selectedExecution.responses || []).length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Levados: </span>
                    <span className="font-bold text-emerald-500">
                      {(selectedExecution.responses || []).filter((r: any) => r.checked).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Esquecidos: </span>
                    <span className="font-bold text-red-500">
                      {(selectedExecution.responses || []).filter((r: any) => !r.checked).length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground block">Conformidade</span>
                    <span className="text-2xl font-black text-amber-500">
                      {selectedExecution.compliance_score || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between items-center border-t border-amber-500/10 pt-4">
            <Button variant="ghost" onClick={() => setSelectedExecution(null)}>
              Fechar
            </Button>
            <Button
              onClick={handleGeneratePdf}
              className="bg-amber-500 text-amber-950 hover:bg-amber-600 gap-2"
            >
              <FileText className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
