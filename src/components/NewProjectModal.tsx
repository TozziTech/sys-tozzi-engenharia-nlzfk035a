import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Slider } from '@/components/ui/slider'
import { DatePicker } from './DatePicker'
import useProjectStore from '@/stores/useProjectStore'
import { Discipline, Status } from '@/types/project'
import { useToast } from '@/hooks/use-toast'

export function NewProjectModal() {
  const { isNewProjectModalOpen, setNewProjectModalOpen, addProject } = useProjectStore()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [discipline, setDiscipline] = useState<Discipline | ''>('')
  const [status, setStatus] = useState<Status | ''>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [progress, setProgress] = useState([0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !client || !discipline || !status || !startDate || !endDate) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    addProject({
      id: Math.random().toString(36).substring(7),
      name,
      client,
      discipline: discipline as Discipline,
      status: status as Status,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      progress: progress[0],
    })

    toast({
      title: 'Projeto criado!',
      description: `O projeto ${name} foi adicionado com sucesso.`,
    })

    setNewProjectModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setClient('')
    setDiscipline('')
    setStatus('')
    setStartDate(undefined)
    setEndDate(undefined)
    setProgress([0])
  }

  return (
    <Dialog open={isNewProjectModalOpen} onOpenChange={setNewProjectModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Criar Novo Projeto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para adicionar um novo projeto ao painel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label htmlFor="name">Nome do Projeto</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Edifício Aurora"
                />
              </div>
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label htmlFor="client">Cliente</Label>
                <Input
                  id="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Ex: Construtora Alfa"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label>Disciplina</Label>
                <Select
                  value={discipline}
                  onValueChange={(val) => setDiscipline(val as Discipline)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Hidrossanitário">Hidrossanitário</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Arquitetônico">Arquitetônico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as Status)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label>Data de Início</Label>
                <DatePicker date={startDate} setDate={setStartDate} label="Início" />
              </div>
              <div className="grid gap-2 col-span-2 sm:col-span-1">
                <Label>Data de Entrega</Label>
                <DatePicker date={endDate} setDate={setEndDate} label="Entrega" />
              </div>
            </div>
            <div className="grid gap-4 mt-2">
              <div className="flex justify-between items-center">
                <Label>Progresso Inicial</Label>
                <span className="text-sm font-medium text-muted-foreground">{progress[0]}%</span>
              </div>
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="[&_[role=slider]]:border-indigo-600 [&_[role=slider]]:bg-indigo-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setNewProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
