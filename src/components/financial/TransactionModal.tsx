import { useState } from 'react'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
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

export function TransactionModal() {
  const { projects, addTransaction } = useProjectStore()
  const { categories, addCategory } = useFinancialCategories()

  const [isOpen, setIsOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)
  const [searchCategory, setSearchCategory] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type: 'Entrada',
    status: 'Pendente',
    value: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    categoryId: '',
    is_recurring: false,
    frequency: 'Mensal',
    end_date: '',
  })

  const handleSubmit = () => {
    if (!formData.description || !formData.date || !formData.value) return
    if (
      formData.is_recurring &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.date)
    ) {
      setFormError('A Data Final deve ser igual ou posterior à data inicial.')
      return
    }
    setFormError(null)
    addTransaction({
      description: formData.description,
      type: formData.type as any,
      value: formData.value,
      date: new Date(formData.date).toISOString(),
      projectId: formData.projectId,
      status: formData.status as any,
      categoryId: formData.type === 'Saída' ? formData.categoryId : undefined,
      is_recurring: formData.is_recurring,
      frequency: formData.is_recurring ? formData.frequency : '',
      end_date:
        formData.is_recurring && formData.end_date ? new Date(formData.end_date).toISOString() : '',
      recurrence_group_id: formData.is_recurring ? crypto.randomUUID() : '',
    } as any)
    setIsOpen(false)
    setFormData({
      type: 'Entrada',
      status: 'Pendente',
      value: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      categoryId: '',
      is_recurring: false,
      frequency: 'Mensal',
      end_date: '',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              onValueChange={(v) => setFormData({ ...formData, status: v })}
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
                <SelectItem value="tozzi_interno">TOZZI (Interno)</SelectItem>
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
              <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategory}
                    className="w-full justify-between font-normal"
                  >
                    {formData.categoryId
                      ? categories.find((c) => c.id === formData.categoryId)?.name
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
                                  setFormData({ ...formData, categoryId: newCat.id })
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
                            setFormData({ ...formData, categoryId: '' })
                            setOpenCategory(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !formData.categoryId ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          Sem categoria
                        </CommandItem>
                        {categories.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setFormData({ ...formData, categoryId: c.id })
                              setOpenCategory(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.categoryId === c.id ? 'opacity-100' : 'opacity-0',
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
                id="recurring"
              />
              <Label htmlFor="recurring" className="font-semibold cursor-pointer">
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
                {formError && <p className="col-span-2 text-sm text-red-500">{formError}</p>}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
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
  )
}
