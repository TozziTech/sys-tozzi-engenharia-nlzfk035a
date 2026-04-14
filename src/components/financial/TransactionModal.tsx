import { useState, useEffect } from 'react'
import { Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const initialFormState = {
  type: 'Entrada',
  status: 'Pendente',
  value: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  projectId: '',
  category: '',
  responsible: 'none',
  bankAccount: 'none',
  is_recurring: false,
  frequency: 'Mensal',
  end_date: '',
  attachment: null as File | null,
}

export function TransactionModal() {
  const { projects } = useProjectStore()
  const { categories, addCategory } = useFinancialCategories()

  const [isOpen, setIsOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [searchCategory, setSearchCategory] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])

  const [formData, setFormData] = useState(initialFormState)

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
      pb.collection('bank_accounts')
        .getFullList({ sort: 'name' })
        .then(setBankAccounts)
        .catch(console.error)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    setFormError(null)
    setFieldErrors({})

    const numericAmount = Number(formData.value)
    if (!formData.description || !formData.date || isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Preencha os campos obrigatórios (incluindo um valor válido).')
      return
    }
    if (!formData.category) {
      setFormError('Por favor, selecione uma categoria.')
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

    const payload = {
      description: formData.description,
      type: formData.type,
      amount: numericAmount,
      date: new Date(formData.date).toISOString(),
      project_id: formData.projectId,
      category: formData.category,
      responsible: formData.responsible === 'none' ? '' : formData.responsible,
      bank_account: formData.bankAccount === 'none' ? '' : formData.bankAccount,
      is_recurring: formData.is_recurring,
      frequency: formData.is_recurring ? formData.frequency : '',
      end_date:
        formData.is_recurring && formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      recurrence_group_id: formData.is_recurring ? crypto.randomUUID() : '',
      status: formData.status,
    }

    const submitData = new FormData()
    for (const [key, value] of Object.entries(payload)) {
      if (value !== null) {
        submitData.append(key, value as any)
      }
    }
    if (formData.attachment) {
      submitData.append('attachment', formData.attachment)
    }

    setIsSubmitting(true)
    try {
      await pb.collection('financial_records').create(submitData)

      toast.success('Transação criada com sucesso!')
      setIsOpen(false)
      setFormData({ ...initialFormState })
    } catch (err: any) {
      console.error(err)
      const errors = extractFieldErrors(err)
      setFieldErrors(errors)
      setFormError(getErrorMessage(err) || 'Erro ao salvar transação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Transação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-2">
            <Label className={cn(fieldErrors.description && 'text-red-500')}>Descrição</Label>
            <Input
              className={cn(fieldErrors.description && 'border-red-500')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Compra de materiais..."
            />
            {fieldErrors.description && (
              <span className="text-xs text-red-500">{fieldErrors.description}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className={cn(fieldErrors.type && 'text-red-500')}>Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  type: v,
                })
              }
            >
              <SelectTrigger className={cn(fieldErrors.type && 'border-red-500')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Saída">Saída</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.type && <span className="text-xs text-red-500">{fieldErrors.type}</span>}
          </div>
          <div className="space-y-2">
            <Label className={cn(fieldErrors.amount && 'text-red-500')}>Valor (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              className={cn(fieldErrors.amount && 'border-red-500')}
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            />
            {fieldErrors.amount && (
              <span className="text-xs text-red-500">{fieldErrors.amount}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className={cn(fieldErrors.date && 'text-red-500')}>Data</Label>
            <Input
              type="date"
              className={cn(fieldErrors.date && 'border-red-500')}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            {fieldErrors.date && <span className="text-xs text-red-500">{fieldErrors.date}</span>}
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
            <Label className={cn(fieldErrors.project_id && 'text-red-500')}>
              Projeto Vinculado
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(v) => setFormData({ ...formData, projectId: v })}
            >
              <SelectTrigger className={cn(fieldErrors.project_id && 'border-red-500')}>
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
            {fieldErrors.project_id && (
              <span className="text-xs text-red-500">{fieldErrors.project_id}</span>
            )}
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

          <div className="col-span-2 space-y-2">
            <Label>Conta Bancária</Label>
            <Select
              value={formData.bankAccount}
              onValueChange={(v) => setFormData({ ...formData, bankAccount: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem conta vinculada</SelectItem>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bank_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label className={cn(fieldErrors.category && 'text-red-500')}>Categoria</Label>
            <Popover open={openCategory} onOpenChange={setOpenCategory}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategory}
                  className={cn(
                    'w-full justify-between font-normal',
                    !formData.category && 'text-muted-foreground',
                    fieldErrors.category && 'border-red-500',
                  )}
                >
                  {formData.category
                    ? categories.find((c) => c.id === formData.category)?.name || formData.category
                    : 'Selecione uma categoria...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar ou adicionar..."
                    value={searchCategory}
                    onValueChange={setSearchCategory}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-3 flex flex-col items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Nenhuma categoria encontrada.
                        </span>
                        {searchCategory && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={async () => {
                              try {
                                const newCat = await addCategory(searchCategory)
                                setFormData({
                                  ...formData,
                                  category: newCat?.id || newCat?.name || searchCategory,
                                })
                                setSearchCategory('')
                                setOpenCategory(false)
                              } catch (err) {
                                console.error(err)
                              }
                            }}
                          >
                            Adicionar "{searchCategory}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setFormData({ ...formData, category: '' })
                          setOpenCategory(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            !formData.category ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        Sem categoria
                      </CommandItem>
                      {categories.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setFormData({ ...formData, category: c.id })
                            setOpenCategory(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.category === c.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: c.color || '#ccc' }}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {fieldErrors.category && (
              <span className="text-xs text-red-500">{fieldErrors.category}</span>
            )}
          </div>

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
                id="recurring"
              />
              <Label htmlFor="recurring" className="font-semibold cursor-pointer">
                Lançamento Recorrente?
              </Label>
            </div>
            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className={cn(fieldErrors.frequency && 'text-red-500')}>Frequência</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                  >
                    <SelectTrigger className={cn(fieldErrors.frequency && 'border-red-500')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.frequency && (
                    <span className="text-xs text-red-500">{fieldErrors.frequency}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={cn(fieldErrors.end_date && 'text-red-500')}>
                    Data Final (Opcional)
                  </Label>
                  <Input
                    type="date"
                    className={cn(fieldErrors.end_date && 'border-red-500')}
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                  {fieldErrors.end_date && (
                    <span className="text-xs text-red-500">{fieldErrors.end_date}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-2 mt-2">
            <Label>Comprovante/Anexo</Label>
            <Input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setFormData({ ...formData, attachment: e.target.files?.[0] || null })
              }
            />
          </div>

          {formError && (
            <div className="col-span-2 text-sm text-red-500 font-medium">{formError}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
