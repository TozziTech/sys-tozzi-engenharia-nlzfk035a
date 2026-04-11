import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import useProjectStore from '@/stores/useProjectStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjetistaCard } from '@/components/team/ProjetistaCard'
import { ProjetistaForm } from '@/components/team/ProjetistaForm'
import { User } from '@/types/project'

function UserManagementDialog({ user }: { user: any }) {
  const { projects, assignUserToProjects, updateUserHourlyRate } = useProjectStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [rate, setRate] = useState(user.hourlyRate?.toString() || '0')
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || [])

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const handleSave = () => {
    updateUserHourlyRate(user.id, Number(rate))
    assignUserToProjects(user.id, selectedProjects)
    toast({
      title: 'Perfil atualizado',
      description: `Configurações de ${user.name} salvas com sucesso.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Gerenciar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Acessos e Custo</DialogTitle>
          <DialogDescription>
            Configure o valor hora e quais projetos este membro pode visualizar e registrar horas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Valor/Hora (R$)
            </Label>
            <Input
              id="rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Label>Projetos Atribuídos</Label>
            <ScrollArea className="h-48 border rounded-md p-4">
              <div className="flex flex-col gap-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`proj-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleToggleProject(project.id)}
                    />
                    <label
                      htmlFor={`proj-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Team() {
  const { users, updateUserRole } = useProjectStore()
  const [localDesigners, setLocalDesigners] = useState<User[]>([])

  const allDesigners = useMemo(() => {
    const storeDesigners = users.filter((u) => u.role === 'Projetista')
    return [...storeDesigners, ...localDesigners]
  }, [users, localDesigners])

  const handleAddDesigner = (user: User) => {
    setLocalDesigners((prev) => [...prev, user])
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe, projetistas e permissões.
          </p>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="members">Membros Gerais</TabsTrigger>
          <TabsTrigger value="designers">Projetistas</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Membros e Permissões</CardTitle>
              <CardDescription>
                Atribua papéis específicos para controlar o que cada usuário pode visualizar ou
                editar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name?.substring(0, 2) || 'US'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.name}</span>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          Cargo atual:
                          <Badge variant="secondary" className="font-normal text-xs">
                            {user.role || 'Sem cargo'}
                          </Badge>
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full sm:w-[220px]">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select
                          value={user.role || ''}
                          onValueChange={(val: any) => updateUserRole(user.id, val)}
                        >
                          <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                            <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                            <SelectItem value="Projetista">Projetista</SelectItem>
                          </SelectContent>
                        </Select>
                        <UserManagementDialog user={user} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="designers" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <div></div>
            <ProjetistaForm onAdd={handleAddDesigner} />
          </div>

          {allDesigners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDesigners.map((designer) => (
                <ProjetistaCard key={designer.id} user={designer} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed">
              <p>Nenhum projetista cadastrado.</p>
              <p className="text-sm">Clique em "Adicionar Projetista" para começar.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
