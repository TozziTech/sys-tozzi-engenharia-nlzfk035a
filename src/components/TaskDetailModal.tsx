import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { KanbanTask, TaskPriority, TaskStatus } from './KanbanBoard'
import { format } from 'date-fns'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: KanbanTask
  teamMembers: any[]
  onUpdate: (task: KanbanTask) => void
}

const INITIAL_COMMENTS = [
  {
    id: '1',
    author: 'Eduardo Costa',
    text: 'Iniciei a análise desta tarefa hoje.',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    author: 'Ana Silva',
    text: 'Por favor, me avise quando terminar.',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    author: 'Marcos Paulo',
    text: 'Documentação base anexada na pasta do projeto.',
    date: new Date(Date.now() - 172800000).toISOString(),
  },
]

const INITIAL_HISTORY = [
  {
    id: '1',
    action: 'Status alterado para Em Andamento',
    date: new Date(Date.now() - 3600000).toISOString(),
  },
  { id: '2', action: 'Tarefa criada', date: new Date(Date.now() - 172800000).toISOString() },
]

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  teamMembers,
  onUpdate,
}: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<KanbanTask>(task)
  const [comments, setComments] = useState(INITIAL_COMMENTS)
  const [history, setHistory] = useState(INITIAL_HISTORY)
  const [newComment, setNewComment] = useState('')

  const handleSave = () => {
    const newHistory = [...history]
    if (editedTask.status !== task.status) {
      newHistory.unshift({
        id: Math.random().toString(),
        action: `Status alterado de ${task.status} para ${editedTask.status}`,
        date: new Date().toISOString(),
      })
    }
    if (editedTask.priority !== task.priority) {
      newHistory.unshift({
        id: Math.random().toString(),
        action: `Prioridade alterada de ${task.priority} para ${editedTask.priority}`,
        date: new Date().toISOString(),
      })
    }
    setHistory(newHistory)
    onUpdate(editedTask)
    onClose()
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    setComments([
      {
        id: Math.random().toString(),
        author: 'Eduardo Costa',
        text: newComment,
        date: new Date().toISOString(),
      },
      ...comments,
    ])
    setNewComment('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Detalhes da Tarefa</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    value={editedTask.assigneeId?.toString() || 'unassigned'}
                    onValueChange={(v) =>
                      setEditedTask({
                        ...editedTask,
                        assigneeId: v === 'unassigned' ? undefined : Number(v),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Nenhum</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={editedTask.deadline || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={editedTask.priority}
                    onValueChange={(v) =>
                      setEditedTask({ ...editedTask, priority: v as TaskPriority })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editedTask.status}
                    onValueChange={(v) => setEditedTask({ ...editedTask, status: v as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A Fazer">A Fazer</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="comments" className="space-y-4 mt-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment}>Enviar</Button>
              </div>
              <div className="space-y-4 mt-4">
                {comments.map((c) => (
                  <div key={c.id} className="bg-muted p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{c.author}</span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(c.date), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-foreground/90">{c.text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="history" className="space-y-4 mt-0">
              <div className="relative border-l border-muted-foreground/20 ml-3 space-y-6">
                {history.map((h) => (
                  <div key={h.id} className="pl-6 relative">
                    <div className="absolute w-2 h-2 bg-primary rounded-full -left-[4.5px] top-1.5 ring-4 ring-background" />
                    <p className="text-sm font-medium">{h.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(h.date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
