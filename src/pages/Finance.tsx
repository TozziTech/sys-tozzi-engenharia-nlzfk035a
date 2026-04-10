import { useState } from 'react'
import { Plus, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

type Transaction = {
  id: string
  description: string
  type: 'Entrada' | 'Saída'
  amount: number
  date: string
  project: string
  status: 'Pendente' | 'Pago'
}

const mockProjects = [
  'Implantação de Rede',
  'Manutenção Preventiva',
  'Reforma Escritório Centro',
  'Nova Filial Sul',
]

const initialData: Transaction[] = [
  {
    id: '1',
    description: 'Pagamento Inicial',
    type: 'Entrada',
    amount: 15000,
    date: '2023-10-01',
    project: 'Implantação de Rede',
    status: 'Pago',
  },
  {
    id: '2',
    description: 'Compra de Equipamentos',
    type: 'Saída',
    amount: 4500,
    date: '2023-10-05',
    project: 'Implantação de Rede',
    status: 'Pago',
  },
  {
    id: '3',
    description: 'Serviços de Consultoria',
    type: 'Entrada',
    amount: 8000,
    date: '2023-10-10',
    project: 'Manutenção Preventiva',
    status: 'Pendente',
  },
  {
    id: '4',
    description: 'Licenças de Software',
    type: 'Saída',
    amount: 1200,
    date: '2023-10-12',
    project: 'Manutenção Preventiva',
    status: 'Pendente',
  },
  {
    id: '5',
    description: 'Adiantamento Cliente',
    type: 'Entrada',
    amount: 5000,
    date: '2023-10-15',
    project: 'Reforma Escritório Centro',
    status: 'Pago',
  },
]

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'Entrada',
    status: 'Pendente',
    amount: 0,
    description: '',
    date: '',
    project: '',
  })

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const handleSubmit = () => {
    if (!formData.description || !formData.date || !formData.project || !formData.amount) return
    const newTx = { ...formData, id: Math.random().toString() } as Transaction
    setTransactions([newTx, ...transactions])
    setIsModalOpen(false)
    setFormData({
      type: 'Entrada',
      status: 'Pendente',
      amount: 0,
      description: '',
      date: '',
      project: '',
    })
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-indigo-500" />
            Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie as receitas e despesas dos seus projetos.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                  onValueChange={(v: 'Entrada' | 'Saída') => setFormData({ ...formData, type: v })}
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
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
                  value={formData.project}
                  onValueChange={(v) => setFormData({ ...formData, project: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Os dados inseridos nesta sessão são temporários e serão perdidos ao recarregar a página
          até que o backend seja integrado.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor (R$)</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Projeto Vinculado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.description}</TableCell>
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
                  <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">{tx.project}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
