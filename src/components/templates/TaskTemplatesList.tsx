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
import { Plus, Trash2, CornerDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskTemplate {
  id: string
  title: string
  priority: string
  ordem: number
  parent_template: string
  children?: TaskTemplate[]
}

export function TaskTemplatesList({ templateId }: { templateId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [addingTo, setAddingTo] = useState<string | null>(null) // null = not adding, '' = adding to root, 'id' = adding to parent

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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta tarefa padrão? Todas as subtarefas também serão removidas.'))
      return
    await pb.collection('task_templates').delete(id)
    load()
  }

  const buildTree = (flatList: any[], parentId: string = ''): TaskTemplate[] => {
    return flatList
      .filter((t) => (t.parent_template || '') === parentId)
      .sort((a, b) => a.ordem - b.ordem)
      .map((t) => ({
        ...t,
        children: buildTree(flatList, t.id),
      }))
  }

  const tree = buildTree(tasks)

  const renderTree = (items: TaskTemplate[], depth = 0) => {
    return items.map((t) => (
      <div key={t.id}>
        <div
          className={cn(
            'flex items-center justify-between p-3 border border-border bg-card rounded-md mt-2 hover:border-primary/30 transition-colors',
            depth > 0 && 'ml-6 sm:ml-10 border-l-2 border-l-primary/30',
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div className="truncate">
              <p className="font-medium text-sm truncate">{t.title}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span className="bg-accent px-1.5 py-0.5 rounded shrink-0">
                  Prioridade: {t.priority}
                </span>
                <span className="bg-accent px-1.5 py-0.5 rounded shrink-0">Ordem: {t.ordem}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs hidden sm:flex"
              onClick={() => setAddingTo(t.id)}
            >
              <Plus className="h-3 w-3 mr-1" /> Sub-tarefa
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:hidden"
              onClick={() => setAddingTo(t.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
              onClick={() => handleDelete(t.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {addingTo === t.id && (
          <div className={cn('mt-2', depth > -1 && 'ml-6 sm:ml-10')}>
            <TaskForm
              parentId={t.id}
              onCancel={() => setAddingTo(null)}
              onSuccess={() => {
                setAddingTo(null)
                load()
              }}
              templateId={templateId}
              currentCount={t.children?.length || 0}
            />
          </div>
        )}

        {t.children && t.children.length > 0 && (
          <div className="mt-0">{renderTree(t.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
        <h3 className="text-sm font-medium ml-2 text-foreground">Estrutura de Tarefas</h3>
        <Button onClick={() => setAddingTo('')} size="sm" disabled={addingTo === ''}>
          <Plus className="h-4 w-4 mr-2" /> Nova Raiz
        </Button>
      </div>

      {addingTo === '' && (
        <TaskForm
          parentId=""
          onCancel={() => setAddingTo(null)}
          onSuccess={() => {
            setAddingTo(null)
            load()
          }}
          templateId={templateId}
          currentCount={tree.length}
        />
      )}

      <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2 pb-4">
        {tree.length > 0
          ? renderTree(tree)
          : !addingTo && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md bg-card/50">
                Nenhuma tarefa cadastrada para este modelo.
              </div>
            )}
      </div>
    </div>
  )
}

function TaskForm({ parentId, onCancel, onSuccess, templateId, currentCount }: any) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Média')

  const handleAdd = async () => {
    if (!title.trim()) return
    await pb.collection('task_templates').create({
      discipline_template: templateId,
      title: title.trim(),
      priority,
      ordem: currentCount + 1,
      is_internal: false,
      parent_template: parentId || null,
    })
    onSuccess()
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 border border-primary/40 bg-primary/5 rounded-md shadow-sm animate-fade-in-up">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome da tarefa..."
        className="flex-1 bg-background"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') onCancel()
        }}
      />
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-full sm:w-[130px] bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Baixa">Baixa</SelectItem>
          <SelectItem value="Média">Média</SelectItem>
          <SelectItem value="Alta">Alta</SelectItem>
          <SelectItem value="Urgente">Urgente</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancelar
        </Button>
        <Button onClick={handleAdd} className="flex-1 sm:flex-none">
          Salvar
        </Button>
      </div>
    </div>
  )
}
