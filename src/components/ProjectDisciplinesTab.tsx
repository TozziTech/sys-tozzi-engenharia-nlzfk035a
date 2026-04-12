import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProjectModule } from '@/types/project_modules'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function ProjectDisciplinesTab({ projectId }: { projectId: string }) {
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [newModuleName, setNewModuleName] = useState('')
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [mods, usrs] = await Promise.all([
        pb.collection('project_modules').getFullList<ProjectModule>({
          filter: `project = "${projectId}"`,
          expand: 'responsible,designer',
        }),
        pb.collection('users').getFullList(),
      ])
      setModules(mods)
      setUsers(usrs)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  useRealtime('project_modules', loadData)

  const handleUpdate = async (
    moduleId: string,
    field: 'responsible' | 'designer',
    value: string,
  ) => {
    try {
      await pb
        .collection('project_modules')
        .update(moduleId, { [field]: value === 'unassigned' ? null : value })
      toast({ title: 'Módulo atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar módulo', variant: 'destructive' })
    }
  }

  const handleAdd = async () => {
    if (!newModuleName.trim()) return
    try {
      await pb.collection('project_modules').create({
        name: newModuleName,
        project: projectId,
        status: 'Pendente',
        progress: 0,
      })
      setNewModuleName('')
      toast({ title: 'Módulo adicionado' })
    } catch (e) {
      toast({ title: 'Erro ao adicionar módulo', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('project_modules').delete(id)
      toast({ title: 'Módulo removido' })
    } catch (e) {
      toast({ title: 'Erro ao remover módulo', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Disciplinas e Equipe
        </CardTitle>
        <CardDescription>
          Gerencie as disciplinas do projeto e defina o Responsável (Gerente) e o Projetista
          (Designer) para cada uma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="Nome da nova disciplina..."
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="max-w-sm"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Responsável (Gerente)</TableHead>
                <TableHead>Projetista (Designer)</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length > 0 ? (
                modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.name}</TableCell>
                    <TableCell>
                      <Select
                        value={mod.responsible || 'unassigned'}
                        onValueChange={(v) => handleUpdate(mod.id, 'responsible', v)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-muted-foreground italic">
                            Sem responsável
                          </SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      u.avatar
                                        ? pb.files.getURL(u, u.avatar)
                                        : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                                    }
                                  />
                                  <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                {u.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mod.designer || 'unassigned'}
                        onValueChange={(v) => handleUpdate(mod.id, 'designer', v)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Sem projetista" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-muted-foreground italic">
                            Sem projetista
                          </SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      u.avatar
                                        ? pb.files.getURL(u, u.avatar)
                                        : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                                    }
                                  />
                                  <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                {u.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(mod.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma disciplina cadastrada para este projeto.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
