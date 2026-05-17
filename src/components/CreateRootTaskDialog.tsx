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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

interface Project {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface CreateRootTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateRootTaskDialog({ open, onOpenChange, onSuccess }: CreateRootTaskDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('Pendente')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setProjectId('')
      setDueDate(undefined)
      setStatus('Pendente')
      setSelectedTags([])
      setErrors({})

      const fetchOptions = async () => {
        try {
          const [projectsRes, tagsRes] = await Promise.all([
            pb.collection('projects').getFullList<Project>({
              filter: `is_archived = false && deleted_at = ""`,
              sort: 'name',
            }),
            pb.collection('tags').getFullList<Tag>({
              sort: 'name',
            }),
          ])
          setProjects(projectsRes)
          setTags(tagsRes)
        } catch (error) {
          console.error('Error fetching options', error)
        }
      }
      fetchOptions()
    }
  }, [open])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: 'O título é obrigatório.' })
      return
    }
    if (!projectId) {
      setErrors({ project: 'O projeto é obrigatório.' })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const data = {
        title: title,
        description: description,
        project: projectId,
        status: status,
        due_date: dueDate ? dueDate.toISOString() : null,
        tags: selectedTags,
        responsible: user?.id,
      }

      await pb.collection('tasks').create(data)

      toast({ title: 'Tarefa criada com sucesso!' })
      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        toast({
          title: 'Erro ao criar tarefa',
          description: err.message,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa Raiz</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Preparação do Terreno"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project">
              Projeto <span className="text-destructive">*</span>
            </Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="project" className={errors.project ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project && <p className="text-sm text-destructive">{errors.project}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, 'PP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal h-auto min-h-10 py-2"
                >
                  <div className="flex flex-wrap gap-1 items-center">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId)
                        if (!tag) return null
                        return (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="mr-1"
                            style={{ backgroundColor: tag.color, color: '#fff' }}
                          >
                            {tag.name}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">Selecione tags...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2" align="start">
                <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhuma tag encontrada.
                    </p>
                  ) : (
                    tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => toggleTag(tag.id)}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50',
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="flex-1 text-sm">{tag.name}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
