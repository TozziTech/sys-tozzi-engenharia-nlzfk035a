import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { Tag, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getContrastYIQ } from '@/lib/colors'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TaskSheetProps {
  task: any
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTaskUpdated: () => void
}

export function TaskSheet({ task, open, onOpenChange, projectId, onTaskUpdated }: TaskSheetProps) {
  const [title, setTitle] = useState('')
  const [concluida, setConcluida] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [thId, setThId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const stateRef = useRef({ title, concluida, descricao, thId, tags })

  useEffect(() => {
    pb.collection('tags').getFullList({ sort: 'name' }).then(setAllTags).catch(console.error)
  }, [])

  useEffect(() => {
    async function fetchTaskData() {
      if (task && open) {
        setIsLoading(true)
        let fetchedThId = null
        let fetchedTitle = task.title || task.titulo || ''
        let fetchedConcluida = task.status === 'Concluído' || task.concluida === true
        let fetchedDesc = task.description || task.descricao || ''

        try {
          const th = await pb
            .collection('tarefas_hierarquicas')
            .getFirstListItem(`titulo="${task.title}" && projeto_id="${projectId}"`)

          fetchedThId = th.id
          fetchedTitle = th.titulo
          fetchedConcluida = th.concluida
          fetchedDesc = th.descricao || ''
        } catch {
          // Fallback to tasks data if not found in tarefas_hierarquicas
        }

        setTitle(fetchedTitle)
        setConcluida(fetchedConcluida)
        const fetchedTags = task.tags || []

        setDescricao(fetchedDesc)
        setThId(fetchedThId)
        setTags(fetchedTags)

        stateRef.current = {
          title: fetchedTitle,
          concluida: fetchedConcluida,
          descricao: fetchedDesc,
          thId: fetchedThId,
          tags: fetchedTags,
        }
        setIsLoading(false)
      }
    }
    fetchTaskData()
  }, [task, open, projectId])

  useEffect(() => {
    stateRef.current = { title, concluida, descricao, thId, tags }
  }, [title, concluida, descricao, thId, tags])

  const saveChanges = useCallback(async () => {
    if (!task || !projectId || isLoading) return
    const current = stateRef.current
    try {
      const statusStr = current.concluida ? 'Concluído' : 'Pendente'

      await pb.collection('tasks').update(task.id, {
        title: current.title,
        status: statusStr,
        description: current.descricao,
        tags: current.tags,
      })

      if (current.thId) {
        await pb.collection('tarefas_hierarquicas').update(current.thId, {
          titulo: current.title,
          concluida: current.concluida,
          descricao: current.descricao,
        })
      } else {
        try {
          const th = await pb.collection('tarefas_hierarquicas').create({
            projeto_id: projectId,
            titulo: current.title,
            concluida: current.concluida,
            descricao: current.descricao,
            ordem: 0,
          })
          setThId(th.id)
          stateRef.current.thId = th.id
        } catch (err) {
          console.error('Failed to create in tarefas_hierarquicas', err)
        }
      }
    } catch (err) {
      console.error('Auto-save failed', err)
    }
  }, [task, projectId, isLoading])

  useEffect(() => {
    if (!task || !open || isLoading) return
    const timer = setTimeout(() => {
      saveChanges()
    }, 800)
    return () => clearTimeout(timer)
  }, [title, concluida, descricao, tags, task, open, isLoading, saveChanges])

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen) {
      await saveChanges()
      onTaskUpdated()
      onOpenChange(false)
    }
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden w-[400px] border-l">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Detalhes da Tarefa
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Edite os detalhes da tarefa. As alterações são salvas automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-7 px-1">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Título da Tarefa
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
              className="font-medium h-11"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="concluida-status"
                checked={concluida}
                onCheckedChange={(c) => setConcluida(!!c)}
                className="w-5 h-5 rounded-sm"
                disabled={isLoading}
              />
              <Label
                htmlFor="concluida-status"
                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Marcar como concluída
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId)
                if (!tag) return null
                return (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }}
                    className="pr-1 gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => setTags((prev) => prev.filter((id) => id !== tagId))}
                      className="ml-1 rounded-full bg-black/20 hover:bg-black/40 p-0.5"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
                  <Tag className="h-4 w-4" /> Adicionar Tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Tags Disponíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={tags.includes(tag.id)}
                    onCheckedChange={(c) => {
                      setTags((prev) =>
                        c ? [...prev, tag.id] : prev.filter((id) => id !== tag.id),
                      )
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição detalhada para esta tarefa..."
              className="min-h-[220px] resize-y leading-relaxed p-4"
              disabled={isLoading}
            />
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-border text-xs text-slate-600 dark:text-slate-400 space-y-3 mt-8 shadow-inner">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider text-[10px]">
              Metadados
            </h4>
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="font-medium">ID da Tarefa:</span>
              <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded text-[10px]">
                {task.id}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <span className="font-medium">Projeto:</span>
              <span
                className="font-mono truncate max-w-[150px] bg-white dark:bg-slate-950 px-2 py-0.5 rounded text-[10px]"
                title={projectId}
              >
                {projectId}
              </span>
            </div>
            {task.parent_task && (
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="font-medium">Tarefa Pai:</span>
                <span className="font-mono truncate max-w-[150px] bg-white dark:bg-slate-950 px-2 py-0.5 rounded text-[10px]">
                  {task.parent_task}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-medium">Criado em:</span>
              <span>{new Date(task.created).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
