import { useState, useMemo } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, FilterX, Tags, Trash2 } from 'lucide-react'
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useProjectStore from '@/stores/useProjectStore'
import type { Transaction } from '@/types/project'

export default function Financial() {
  const { projects, transactions, addTransaction, categories, addCategory, deleteCategory } =
    useProjectStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'Entrada',
    status: 'Pendente',
    value: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    categoryId: '',
  })

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
  }

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedProject !== 'all' && tx.projectId !== selectedProject) return false
        if (selectedType !== 'all' && tx.type !== selectedType) return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedProject, selectedType])

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedType('all')
  }

  const handleSubmit = () => {
    if (!formData.description || !formData.date || !formData.projectId || !formData.value) return

    addTransaction({
      description: formData.description,
      type: formData.type as 'Entrada' | 'Saída',
      value: formData.value,
      date: new Date(formData.date).toISOString(),
      projectId: formData.projectId,
      status: formData.status as 'Pendente' | 'Pago',
      categoryId: formData.type === 'Saída' ? formData.categoryId : undefined,
    })

    setIsModalOpen(false)
    setFormData({
      type: 'Entrada',
      status: 'Pendente',
      value: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      categoryId: '',
    })
  }

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory({ name: newCatName.trim(), color: newCatColor })
      setNewCatName('')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            Módulo Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie e registre as transações de todos os seus projetos.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-slate-950">
                <Tags className="h-4 w-4 mr-2" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias de Despesas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nova categoria..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <Input
                    type="color"
                    className="w-14 h-10 p-1 cursor-pointer"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                  />
                  <Button onClick={handleAddCategory}>Adicionar</Button>
                </div>
                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteCategory(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-md">
                      Nenhuma categoria cadastrada.
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Compra de materiais..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: 'Entrada' | 'Saída') =>
                      setFormData({
                        ...formData,
                        type: v,
                        categoryId: v === 'Entrada' ? undefined : formData.categoryId,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saída">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: 'Pendente' | 'Pago') =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Projeto Vinculado</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'Saída' && (
                  <div className="col-span-2 space-y-2">
                    <Label>Categoria de Despesa</Label>
                    <Select
                      value={formData.categoryId || 'none'}
                      onValueChange={(v) =>
                        setFormData({ ...formData, categoryId: v === 'none' ? undefined : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[250px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Filtrar por Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Filtrar por Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="Entrada">Entrada</SelectItem>
            <SelectItem value="Saída">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto bg-white dark:bg-slate-950"
          disabled={selectedProject === 'all' && selectedType === 'all'}
        >
          <FilterX className="h-4 w-4 mr-2" /> Limpar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operações e Histórico</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lista de todas as transações de acordo com os filtros.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId)
                    const proj = projects.find((p) => p.id === tx.projectId)
                    return (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell>
                          {tx.type === 'Saída' && cat ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.type === 'Entrada' ? (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                              <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-medium">
                              <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(tx.value)}</TableCell>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {proj?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {tx.status === 'Pago' ? (
                            <Badge
                              variant="default"
                              className="bg-emerald-500 hover:bg-emerald-600 border-transparent text-white"
                            >
                              Pago
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-500 dark:text-amber-400"
                            >
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
