import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

export function TaskTemplatesList({ templateId }: { templateId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Média')

  const load = async () => {
    const res = await pb.collection('task_templates').getFullList({
      filter: `discipline_template="${templateId}"`,
      sort: 'ordem,created',
    })
    setTasks(res)
  }

  useEffect(() => {
    load()
  }, [templateId])

  const handleAdd = async () => {
    if (!title) return
    await pb.collection('task_templates').create({
      discipline_template: templateId,
      title,
      priority,
      ordem: tasks.length + 1,
      is_internal: false,
    })
    setTitle('')
    load()
  }

  const handleDelete = async (id: string) => {
    await pb.collection('task_templates').delete(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome da tarefa padrão..."
          className="flex-1"
        />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Baixa">Baixa</SelectItem>
            <SelectItem value="Média">Média</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto mt-4 pr-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 border border-border bg-card rounded-md"
          >
            <div>
              <p className="font-medium text-sm">{t.title}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span className="bg-accent px-1.5 py-0.5 rounded">Prioridade: {t.priority}</span>
                <span className="bg-accent px-1.5 py-0.5 rounded">Ordem: {t.ordem}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => handleDelete(t.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            Nenhuma tarefa cadastrada para este modelo.
          </div>
        )}
      </div>
    </div>
  )
}
