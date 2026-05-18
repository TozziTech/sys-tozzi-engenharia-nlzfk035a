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
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { usePermissions } from '@/hooks/use-permissions'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { TaskAttachments } from './TaskAttachments'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface EditTaskDialogProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
}

export function EditTaskDialog({ taskId, open, onOpenChange, onTaskUpdated }: EditTaskDialogProps) {
  const { toast } = useToast()
  const { can } = usePermissions()
  const canEdit = can('edit', 'tasks')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [task, setTask] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Média')
  const [responsible, setResponsible] = useState('none')
  const [isInternal, setIsInternal] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [users, setUsers] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      setErrors({})
      pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
      pb.collection('tags').getFullList({ sort: 'name' }).then(setTags).catch(console.error)

      if (taskId) {
        setLoading(true)
        pb.collection('tasks')
          .getOne(taskId)
          .then((t) => {
            setTask(t)
            setTitle(t.title || '')
            setDescription(t.description || '')
            setStatus(t.status || 'Pendente')
            setDueDate(t.due_date ? t.due_date.substring(0, 10) : '')
            setPriority(t.priority || 'Média')
            setResponsible(t.responsible || 'none')
            setIsInternal(t.is_internal || false)
            setSelectedTags(t.tags || [])
          })
          .catch((err) => {
            console.error(err)
            toast({
              title: 'Erro',
              description: 'Não foi possível carregar a tarefa',
              variant: 'destructive',
            })
            onOpenChange(false)
          })
          .finally(() => setLoading(false))
      }
    } else {
      setTask(null)
    }
  }, [open, taskId])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: 'O título é obrigatório.' })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const data: any = {
        title,
        description,
        status,
        priority,
        is_internal: isInternal,
        tags: selectedTags,
      }

      if (dueDate) {
        data.due_date = `${dueDate} 12:00:00.000Z`
      } else {
        data.due_date = null
      }

      if (responsible && responsible !== 'none') {
        data.responsible = responsible
      } else {
        data.responsible = null
      }

      if (status === 'Concluído' && task?.status !== 'Concluído') {
        data.completed_at = new Date().toISOString()
      } else if (status !== 'Concluído') {
        data.completed_at = null
      }

      await pb.collection('tasks').update(taskId!, data)

      toast({ title: 'Tarefa atualizada com sucesso!' })
      onTaskUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        toast({
          title: 'Erro ao atualizar tarefa',
          description: err.message,
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const handleAttachmentUpdate = (updatedTask: any) => {
    setTask(updatedTask)
    onTaskUpdated?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-2 border-b border-border/50">
              <TabsList className="w-full grid grid-cols-2 h-11">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden px-6 py-4">
              <TabsContent value="details" className="space-y-4 mt-0 h-full overflow-y-auto pr-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">
                    Título da Tarefa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEdit}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc">Descrição</Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                        <SelectItem value="Revisão">Revisão</SelectItem>
                        <SelectItem value="Não Realizado">Não Realizado</SelectItem>
                        <SelectItem value="Espera">Espera</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Data de Vencimento</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Responsável</Label>
                    <Select value={responsible} onValueChange={setResponsible} disabled={!canEdit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {users
                          .filter((u) => u.status !== 'Inativo')
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="internal" className="cursor-pointer">
                    Tarefa Interna (invisível para cliente)
                  </Label>
                </div>

                <div className="grid gap-2 pt-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <Badge
                        key={t.id}
                        variant={selectedTags.includes(t.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={
                          selectedTags.includes(t.id)
                            ? { backgroundColor: t.color }
                            : { borderColor: t.color, color: t.color }
                        }
                        onClick={() => canEdit && toggleTag(t.id)}
                      >
                        {t.name}
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-sm text-muted-foreground">Nenhuma tag disponível.</span>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-0 h-full">
                {task && (
                  <TaskAttachments
                    taskId={task.id}
                    attachments={
                      task.attachments
                        ? Array.isArray(task.attachments)
                          ? task.attachments
                          : [task.attachments]
                        : []
                    }
                    onUpdate={handleAttachmentUpdate}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          {canEdit && (
            <Button onClick={handleSubmit} disabled={saving || loading}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
