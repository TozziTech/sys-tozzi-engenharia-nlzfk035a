import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { TaskTemplatesList } from './TaskTemplatesList'
import { cn } from '@/lib/utils'

export function DisciplineTemplateDialog({ isOpen, onClose, templateId }: any) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details')
  const { toast } = useToast()
  const [currentId, setCurrentId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (templateId) {
        setCurrentId(templateId)
        pb.collection('discipline_templates')
          .getOne(templateId)
          .then((record) => {
            setName(record.name)
            setDescription(record.description || '')
          })
      } else {
        setCurrentId(null)
        setName('')
        setDescription('')
      }
      setActiveTab('details')
    }
  }, [isOpen, templateId])

  const handleSave = async () => {
    try {
      if (currentId) {
        await pb.collection('discipline_templates').update(currentId, { name, description })
        toast({ title: 'Modelo atualizado' })
      } else {
        const res = await pb.collection('discipline_templates').create({ name, description })
        setCurrentId(res.id)
        toast({ title: 'Modelo criado com sucesso. Agora adicione as tarefas padrão.' })
        setActiveTab('tasks')
      }
    } catch (e) {
      toast({ title: 'Erro ao salvar o modelo', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentId ? 'Editar Modelo de Disciplina' : 'Novo Modelo de Disciplina'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <button
            type="button"
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab('details')}
          >
            Detalhes do Modelo
          </button>
          <button
            type="button"
            disabled={!currentId}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              activeTab === 'tasks'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab('tasks')}
          >
            Tarefas Padrão
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Projeto Estrutural, Projeto Hidrossanitário..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre este modelo..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar Detalhes</Button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && currentId && <TaskTemplatesList templateId={currentId} />}
      </DialogContent>
    </Dialog>
  )
}
