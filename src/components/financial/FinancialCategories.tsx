import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFinancialCategories } from '@/hooks/use-financial-categories'

export function FinancialCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinancialCategories()
  const safeCategories = Array.isArray(categories) ? categories : []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [monthlyLimit, setMonthlyLimit] = useState<number | ''>('')

  const handleOpen = (c?: any) => {
    if (c) {
      setEditId(c.id)
      setName(c.name)
      setColor(c.color || '#6366f1')
      setMonthlyLimit(c.monthly_limit || '')
    } else {
      setEditId(null)
      setName('')
      setColor('#6366f1')
      setMonthlyLimit('')
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    const limitVal = monthlyLimit === '' ? null : Number(monthlyLimit)
    try {
      if (editId) await updateCategory(editId, name.trim(), color, limitVal)
      else await addCategory(name.trim(), color, limitVal)
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Categorias de Despesas</CardTitle>
          <CardDescription>
            Gerencie as categorias usadas para classificar os lançamentos.
          </CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}>
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Editar Categoria' : 'Adicionar Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input
                  placeholder="Ex: Administrativa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    className="w-14 h-10 p-1 cursor-pointer"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <span className="text-sm text-slate-500">{color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite Mensal de Gastos (Opcional)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-16">Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Limite Mensal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhuma categoria cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                safeCategories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: c.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.monthly_limit
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(c.monthly_limit)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(c)}>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a categoria "{c.name}"? Esta ação não
                                pode ser desfeita. Lançamentos vinculados poderão ficar sem
                                classificação.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteCategory(c.id)}
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
      </CardContent>
    </Card>
  )
}
