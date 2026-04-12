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

  const stateRef = useRef({ title, concluida, descricao })

  useEffect(() => {
    if (task && open) {
      const initialTitle = task.title || task.titulo || ''
      const initialConcluida = task.status === 'Concluído' || task.concluida === true
      const initialDesc = task.description || task.descricao || ''

      setTitle(initialTitle)
      setConcluida(initialConcluida)
      setDescricao(initialDesc)
      stateRef.current = {
        title: initialTitle,
        concluida: initialConcluida,
        descricao: initialDesc,
      }
    }
  }, [task, open])

  useEffect(() => {
    stateRef.current = { title, concluida, descricao }
  }, [title, concluida, descricao])

  const saveChanges = useCallback(async () => {
    if (!task || !projectId) return
    const current = stateRef.current
    try {
      const statusStr = current.concluida ? 'Concluído' : 'Pendente'

      // Update tasks collection
      await pb.collection('tasks').update(task.id, {
        title: current.title,
        status: statusStr,
        description: current.descricao,
      })

      // Update or create in tarefas_hierarquicas
      try {
        const th = await pb
          .collection('tarefas_hierarquicas')
          .getFirstListItem(`titulo="${task.title}" && projeto_id="${projectId}"`)
        await pb.collection('tarefas_hierarquicas').update(th.id, {
          titulo: current.title,
          concluida: current.concluida,
          descricao: current.descricao,
        })
      } catch {
        await pb.collection('tarefas_hierarquicas').create({
          projeto_id: projectId,
          titulo: current.title,
          concluida: current.concluida,
          descricao: current.descricao,
          ordem: 0,
        })
      }
    } catch (err) {
      console.error('Auto-save failed', err)
    }
  }, [task, projectId])

  useEffect(() => {
    if (!task || !open) return
    const timer = setTimeout(() => {
      saveChanges()
    }, 800)
    return () => clearTimeout(timer)
  }, [title, concluida, descricao, task, open, saveChanges])

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
            />
          </div>

          <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="concluida-status"
                checked={concluida}
                onCheckedChange={(c) => setConcluida(!!c)}
                className="w-5 h-5 rounded-sm"
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
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição detalhada para esta tarefa..."
              className="min-h-[220px] resize-y leading-relaxed p-4"
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
