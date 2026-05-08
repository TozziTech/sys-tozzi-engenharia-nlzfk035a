import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createChecklistTemplate, updateChecklistTemplate } from '@/services/checklists'
import { toast } from 'sonner'

const SERVICE_TYPES = ['estrutural', 'hidrossanitário', 'elétrico', 'diagnóstico', 'outro']
const CATEGORIES = ['segurança', 'medição', 'acesso', 'outro']

export function ChecklistTemplateModal({
  template,
  onClose,
  onSuccess,
}: {
  template?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(template?.name || '')
  const [serviceType, setServiceType] = useState(template?.service_type || 'estrutural')
  const [items, setItems] = useState<any[]>(template?.items || [])

  const handleAddItem = () => {
    setItems([...items, { name: '', category: 'outro', order: items.length + 1 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nome do modelo é obrigatório')
    if (items.length === 0) return toast.error('Adicione pelo menos um item')
    if (items.some((i) => !i.name.trim())) return toast.error('Todos os itens devem ter um nome')

    try {
      const data = { name, service_type: serviceType, items }
      if (template?.id) {
        await updateChecklistTemplate(template.id, data)
        toast.success('Modelo atualizado com sucesso')
      } else {
        await createChecklistTemplate(data)
        toast.success('Modelo criado com sucesso')
      }
      onSuccess()
    } catch (error) {
      toast.error('Erro ao salvar modelo')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-50 dark:bg-slate-900 border-amber-500">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-100">
            {template ? 'Editar Modelo de Checklist' : 'Novo Modelo de Checklist'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-amber-500 focus-visible:ring-amber-500"
                placeholder="Ex: Inspeção Básica"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-amber-500 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 capitalize"
              >
                {SERVICE_TYPES.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className="capitalize bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center">
              <Label>Itens do Checklist</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
              </Button>
            </div>
            <div className="max-h-[40vh] overflow-y-auto border border-amber-500/30 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-amber-500/10 text-slate-700 dark:text-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Ordem</th>
                    <th className="px-4 py-2 font-semibold">Nome do Item</th>
                    <th className="px-4 py-2 font-semibold">Categoria</th>
                    <th className="px-4 py-2 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/30">
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
                    >
                      <td className="px-4 py-2 w-20">
                        <Input
                          type="number"
                          value={item.order}
                          onChange={(e) => updateItem(idx, 'order', Number(e.target.value))}
                          className="border-amber-500 focus-visible:ring-amber-500 h-8"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="border-amber-500 focus-visible:ring-amber-500 h-8"
                        />
                      </td>
                      <td className="px-4 py-2 w-48">
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(idx, 'category', e.target.value)}
                          className="flex h-8 w-full rounded-md border border-amber-500 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 capitalize"
                        >
                          {CATEGORIES.map((cat) => (
                            <option
                              key={cat}
                              value={cat}
                              className="capitalize bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            >
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right w-16">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-300">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
            Salvar Modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
