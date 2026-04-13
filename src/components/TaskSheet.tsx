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
import { RichTextEditor } from '@/components/RichTextEditor'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Button } from '@/components/ui/button'
import { X, Download, FileText, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react'
import { uploadTaskAttachments, deleteTaskAttachment } from '@/services/tasks'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useQuery, queryClient } from '@/hooks/use-query'

interface TaskSheetProps {
  task: any
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTaskUpdated: () => void
  users?: any[]
}

export function TaskSheet({
  task,
  open,
  onOpenChange,
  projectId,
  onTaskUpdated,
  users = [],
}: TaskSheetProps) {
  const [title, setTitle] = useState('')
  const [concluida, setConcluida] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [responsible, setResponsible] = useState<string>('unassigned')
  const [thId, setThId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const { data: freshTask, isLoading: isQueryLoading } = useQuery(
    `task_${task?.id}`,
    () => pb.collection('tasks').getOne(task?.id),
    { enabled: open && !!task?.id, staleTime: 0 },
  )

  const [localTask, setLocalTask] = useState<any>(task)

  const stateRef = useRef({ title, concluida, descricao, responsible, thId })

  useEffect(() => {
    if (freshTask) setLocalTask(freshTask)
    else if (task) setLocalTask(task)
  }, [freshTask, task])

  useEffect(() => {
    async function initTask() {
      if (open && localTask) {
        setIsLoading(true)
        let fetchedThId = null
        let fetchedTitle = localTask.title || localTask.titulo || ''
        let fetchedConcluida = localTask.status === 'Concluído' || localTask.concluida === true
        let fetchedDesc = localTask.description || localTask.descricao || ''
        let fetchedResponsible = localTask.responsible || 'unassigned'

        setAttachments(
          localTask.attachments
            ? Array.isArray(localTask.attachments)
              ? localTask.attachments
              : [localTask.attachments]
            : [],
        )

        try {
          const th = await pb
            .collection('tarefas_hierarquicas')
            .getFirstListItem(`titulo="${localTask.title}" && projeto_id="${projectId}"`)

          fetchedThId = th.id
          fetchedTitle = th.titulo
          fetchedConcluida = th.concluida
          fetchedDesc = th.descricao || ''
        } catch {
          // Keep tasks data
        }

        setTitle(fetchedTitle)
        setConcluida(fetchedConcluida)
        setDescricao(fetchedDesc)
        setResponsible(fetchedResponsible)
        setThId(fetchedThId)

        stateRef.current = {
          title: fetchedTitle,
          concluida: fetchedConcluida,
          descricao: fetchedDesc,
          responsible: fetchedResponsible,
          thId: fetchedThId,
        }
        setIsLoading(false)
      }
    }
    if (!isQueryLoading) {
      initTask()
    }
  }, [localTask, open, projectId, isQueryLoading])

  useEffect(() => {
    stateRef.current = { title, concluida, descricao, responsible, thId }
  }, [title, concluida, descricao, responsible, thId])

  const saveChanges = useCallback(async () => {
    if (!task || !projectId || isLoading) return
    const current = stateRef.current
    try {
      const statusStr = current.concluida ? 'Concluído' : 'Pendente'

      await pb.collection('tasks').update(task.id, {
        title: current.title,
        status: statusStr,
        description: current.descricao,
        responsible: current.responsible === 'unassigned' ? null : current.responsible,
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

      if (task?.module) {
        queryClient().invalidateQueries(`tasks_${task.module}`)
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
  }, [title, concluida, descricao, responsible, task, open, isLoading, saveChanges])

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen) {
      await saveChanges()
      onTaskUpdated()
      onOpenChange(false)
    }
  }

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
    )
    if (validFiles.length !== files.length) {
      toast({
        title: 'Aviso',
        description: 'Alguns arquivos foram ignorados. Apenas imagens e PDFs são permitidos.',
        variant: 'destructive',
      })
    }
    if (validFiles.length === 0) return

    setIsLoading(true)
    try {
      await uploadTaskAttachments(task.id, validFiles)
      const updatedTask = await pb.collection('tasks').getOne(task.id)
      setLocalTask(updatedTask)
      queryClient().setQueryData(`task_${task.id}`, updatedTask)
      setAttachments(
        updatedTask.attachments
          ? Array.isArray(updatedTask.attachments)
            ? updatedTask.attachments
            : [updatedTask.attachments]
          : [],
      )
      onTaskUpdated()
      toast({ title: 'Sucesso', description: 'Arquivos anexados com sucesso.' })
    } catch (err) {
      console.error('Failed to upload attachment', err)
      toast({ title: 'Erro', description: 'Falha ao enviar arquivos.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (filename: string) => {
    setIsLoading(true)
    try {
      await deleteTaskAttachment(task.id, filename)
      const updatedTask = await pb.collection('tasks').getOne(task.id)
      setLocalTask(updatedTask)
      queryClient().setQueryData(`task_${task.id}`, updatedTask)
      setAttachments(
        updatedTask.attachments
          ? Array.isArray(updatedTask.attachments)
            ? updatedTask.attachments
            : [updatedTask.attachments]
          : [],
      )
      onTaskUpdated()
      toast({ title: 'Sucesso', description: 'Anexo removido.' })
    } catch (err) {
      console.error('Failed to delete attachment', err)
      toast({ title: 'Erro', description: 'Falha ao remover anexo.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
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
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Responsável
            </Label>
            <Select value={responsible} onValueChange={setResponsible} disabled={isLoading}>
              <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-dashed">
                <SelectValue placeholder="Atribuir responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-muted-foreground italic">
                  Sem responsável
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatar ? pb.files.getURL(u, u.avatar) : undefined} />
                        <AvatarFallback className="text-[10px]">
                          {u.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{u.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </Label>
            <RichTextEditor
              value={descricao}
              onChange={setDescricao}
              onImageUpload={async (file) => {
                const formData = new FormData()
                formData.append('attachments', file)
                const updated = await pb.collection('tasks').update(task.id, formData)
                const atts = Array.isArray(updated.attachments)
                  ? updated.attachments
                  : [updated.attachments]
                const newAtt = atts[atts.length - 1]
                return pb.files.getURL(updated, newAtt)
              }}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Anexos
              </Label>
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-muted-foreground/25 hover:bg-muted/50',
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.length) processFiles(Array.from(e.dataTransfer.files))
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.length) processFiles(Array.from(e.target.files))
                }}
              />
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              ) : (
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
              )}
              <p className="text-sm font-medium">
                {isLoading ? 'Enviando...' : 'Arraste e solte arquivos aqui'}
              </p>
              <p className="text-xs text-muted-foreground">
                ou clique para selecionar (Imagens e PDFs)
              </p>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2 mt-3">
                {attachments.map((filename) => {
                  const url = pb.files.getURL(localTask, filename)
                  const isImage = filename.match(/\.(jpeg|jpg|gif|png)$/i)

                  return (
                    <div
                      key={filename}
                      className="flex items-center justify-between p-2 border rounded-md bg-slate-50 dark:bg-slate-900/50"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline truncate max-w-[200px]"
                      >
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                        )}
                        <span className="truncate">{filename}</span>
                      </a>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(url, '_blank')
                          }}
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteAttachment(filename)}
                          disabled={isLoading}
                          title="Remover"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center p-4 border border-dashed rounded-md bg-slate-50 dark:bg-slate-900/50">
                Nenhum anexo adicionado.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
