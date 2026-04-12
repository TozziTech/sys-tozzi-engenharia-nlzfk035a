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

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setTitle('')
      setDueDate('')
      setParentTask('none')
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
