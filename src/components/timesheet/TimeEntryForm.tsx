import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { mockProjects, mockTasks } from '@/data/mockTimesheetData'

export function TimeEntryForm() {
  const { toast } = useToast()
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  const filteredTasks = mockTasks.filter((t) => t.projectId === projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !taskId || !date || !hours) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Registro salvo com sucesso',
      description: `${hours}h registradas para a data ${date}.`,
    })

    // Reset form
    setProjectId('')
    setTaskId('')
    setDate('')
    setHours('')
    setDescription('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Horas</CardTitle>
        <CardDescription>Aponte as horas trabalhadas em projetos e tarefas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto *</Label>
              <Select
                value={projectId}
                onValueChange={(val) => {
                  setProjectId(val)
                  setTaskId('')
                }}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task">Tarefa *</Label>
              <Select value={taskId} onValueChange={setTaskId} disabled={!projectId}>
                <SelectTrigger id="task">
                  <SelectValue placeholder="Selecione uma tarefa" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Horas (h) *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="Ex: 4.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição / Observações</Label>
            <Textarea
              id="description"
              placeholder="Descreva o trabalho realizado..."
              className="resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Registrar Horas
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
