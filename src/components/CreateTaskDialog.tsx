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
import { useParams } from 'react-router-dom'
import { createTask } from '@/services/tasks'
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

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  availableParents: { id: string; title: string }[]
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  moduleId,
  availableParents,
}: CreateTaskDialogProps) {
  const { id: projectIdUrl } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [parentTask, setParentTask] = useState('none')
  const [tags, setTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    pb.collection('tags').getFullList({ sort: 'name' }).then(setAllTags).catch(console.error)
  }, [])

  useEffect(() => {
    if (open) {
      setTitle('')
      setDueDate('')
      setParentTask('none')
      setTags([])
      setErrors({})
    }
  }, [open])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: 'O título é obrigatório.' })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      let projectId = projectIdUrl
      if (!projectId) {
        const mod = await pb.collection('project_modules').getOne(moduleId)
        projectId = mod.project
      }

      const data: any = {
        title,
        module: moduleId,
        project: projectId,
        status: 'Pendente',
        tags: tags.length > 0 ? tags : undefined,
      }

      if (dueDate) {
        data.due_date = `${dueDate} 12:00:00.000Z`
      }

      if (parentTask && parentTask !== 'none') {
        data.parent_task = parentTask
      }

      await createTask(data)

      toast({ title: 'Tarefa criada com sucesso!' })
      onOpenChange(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        toast({ title: 'Erro ao criar tarefa', description: err.message, variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">
              Título da Tarefa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Levantamento Planialtimétrico"
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Data de Conclusão</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="parentTask">Tarefa Pai (Opcional)</Label>
            <Select value={parentTask} onValueChange={setParentTask}>
              <SelectTrigger id="parentTask">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Tarefa Raiz)</SelectItem>
                {availableParents.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-1">
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
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((id) => id !== tagId))}
                      className="ml-1 rounded-full bg-black/20 hover:bg-black/40 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 justify-start">
                  <Tag className="h-4 w-4" /> Selecionar Tags
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
