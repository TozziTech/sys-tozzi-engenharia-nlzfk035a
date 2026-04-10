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
import useProjectStore from '@/stores/useProjectStore'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function TimeEntryForm() {
  const { toast } = useToast()
  const { projects, tasks, addTimeLog, users } = useProjectStore()
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')

  // Simulate currently logged-in user
  const currentUser = users[0]

  const isAuthorized =
    currentUser?.assignedProjects?.includes(projectId) || currentUser?.role === 'Administrador'

  const authorizedProjects = projects.filter(
    (p) => currentUser?.assignedProjects?.includes(p.id) || currentUser?.role === 'Administrador',
  )

  const filteredTasks = tasks.filter((t) => t.projectId === projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !taskId || !date || !hours) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (!isAuthorized) {
      toast({
        title: 'Acesso Negado',
        description: 'You are not authorized to register hours for this project.',
        variant: 'destructive',
      })
      return
    }

    const newLogId = crypto.randomUUID()

    addTimeLog({
      id: newLogId,
      projectId,
      taskId,
      userId: currentUser.id,
      date,
      hours: Number(hours),
      description,
      status: 'Pending',
    })

    const auditEntry = {
      id: crypto.randomUUID(),
      time_entry_id: newLogId,
      action: 'Created',
      performed_by: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    try {
      const { supabase } = await import('@/lib/supabase')

      await supabase.from('time_entries').insert({
        id: newLogId,
        project_id: projectId,
        task_id: taskId,
        user_id: currentUser.id,
        date,
        hours: Number(hours),
        description,
        status: 'Pending',
      })

      await supabase.from('audit_logs').insert(auditEntry)
    } catch (err) {
      const all = JSON.parse(localStorage.getItem('mock_audit_logs') || '[]')
      localStorage.setItem('mock_audit_logs', JSON.stringify([auditEntry, ...all]))
    }

    toast({
      title: 'Registro salvo com sucesso',
      description: `${hours}h registradas para a data ${date}.`,
    })

    // Reset form
    setProjectId('')
    setTaskId('')
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
                  {authorizedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  {authorizedProjects.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum projeto atribuído
                    </div>
                  )}
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

          {projectId && !isAuthorized && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não Autorizado</AlertTitle>
              <AlertDescription>
                You are not authorized to register hours for this project.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!isAuthorized && projectId !== ''}
          >
            Registrar Horas
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
