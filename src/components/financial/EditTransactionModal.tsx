import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch'
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import pb from '@/lib/pocketbase/client'

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { projects } = useProjectStore()
  const { categories } = useFinancialCategories()

  const [formError, setFormError] = useState<string | null>(null)
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null)
  const [newAttachment, setNewAttachment] = useState<File | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    description: '',
    type: 'Entrada',
    value: 0,
    date: '',
    projectId: '',
    categoryId: '',
    responsible: 'none',
    status: 'Pendente',
    is_recurring: false,
    frequency: 'Mensal',
    end_date: '',
  })

  useEffect(() => {
    if (open) {
      pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (transaction && open) {
      setFormError(null)
      setExistingAttachment(transaction.attachment || null)
      setNewAttachment(null)
      setRemoveAttachment(false)
      setFormData({
        description: transaction.description || '',
        type: transaction.type || 'Entrada',
        value: transaction.value || transaction.amount || 0,
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        projectId: transaction.projectId || transaction.project_id || '',
        categoryId: transaction.categoryId || transaction.category || '',
        responsible: transaction.responsible || 'none',
        status: transaction.status || 'Pendente',
        is_recurring: transaction.is_recurring || false,
        frequency: transaction.frequency || 'Mensal',
        end_date: transaction.end_date
          ? new Date(transaction.end_date).toISOString().split('T')[0]
          : '',
      })
    }
  }, [transaction, open])

  const handleSave = async () => {
    if (!formData.description || !formData.date || !formData.value) {
      setFormError('Por favor, preencha os campos obrigatórios (Descrição, Valor e Data).')
      return
    }
    if (isNaN(Number(formData.value)) || Number(formData.value) <= 0) {
      setFormError('O valor da transação deve ser um número maior que zero.')
      return
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(formData.date) || isNaN(new Date(formData.date).getTime())) {
      setFormError('Por favor, insira uma data válida.')
      return
    }
    if (
      formData.is_recurring &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.date)
    ) {
      setFormError('A Data Final deve ser igual ou posterior à data inicial.')
      return
    }

    setFormError(null)

    try {
      const data: any = {
        description: formData.description,
        type: formData.type,
        amount: formData.value,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        project_id: formData.projectId,
        category: formData.type === 'Saída' ? formData.categoryId : '',
        responsible: formData.responsible === 'none' ? '' : formData.responsible,
        status: formData.status,
        is_recurring: formData.is_recurring,
        frequency: formData.is_recurring ? formData.frequency : '',
        end_date:
          formData.is_recurring && formData.end_date
            ? new Date(formData.end_date).toISOString()
            : null,
      }

      const submitData = new FormData()
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          submitData.append(key, value as any)
        }
      }

      if (newAttachment) {
        submitData.append('attachment', newAttachment)
      } else if (removeAttachment) {
        submitData.append('attachment', '')
      }

      await pb.collection('financial_records').update(transaction.id, submitData)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setFormError('Erro ao atualizar a transação. Verifique os dados e tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2">
            <Label>
              Descrição <span className="text-red-500">*</span>
            </Label>
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
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  type: v,
                  categoryId: v === 'Entrada' ? '' : formData.categoryId,
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
            <Label>
              Valor (R$) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>
              Data <span className="text-red-500">*</span>
            </Label>
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
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
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
                <SelectItem value="tozzi_interno">TOZZI (Interno)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.responsible}
              onValueChange={(v) => setFormData({ ...formData, responsible: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'Saída' && (
            <div className="col-span-2 space-y-2">
              <Label>Categoria de Despesa</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2 space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50 mt-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_recurring}
                onCheckedChange={(c) =>
                  setFormData({
                    ...formData,
                    is_recurring: c,
                    frequency: formData.frequency || 'Mensal',
                  })
                }
                id="edit-recurring"
              />
              <Label htmlFor="edit-recurring" className="font-semibold cursor-pointer">
                Lançamento Recorrente?
              </Label>
            </div>
            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Final (Opcional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-2 mt-2">
            <Label>Comprovante/Anexo</Label>
            {existingAttachment && !removeAttachment && !newAttachment ? (
              <div className="flex items-center gap-4 p-2 border rounded-md">
                <span className="text-sm truncate max-w-[200px]">{existingAttachment}</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setRemoveAttachment(true)}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  setNewAttachment(e.target.files?.[0] || null)
                  if (e.target.files?.[0]) setRemoveAttachment(false)
                }}
              />
            )}
          </div>

          {formError && <p className="col-span-2 text-sm text-red-500 font-medium">{formError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
