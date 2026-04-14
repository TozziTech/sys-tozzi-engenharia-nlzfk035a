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
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { ProjectModule } from '@/types/project_modules'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

export function ProjectDisciplinesTab({ projectId }: { projectId: string }) {
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleStatus, setNewModuleStatus] = useState<ProjectModule['status']>('Pendente')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
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
    setFieldErrors({})

    const errors: FieldErrors = {}
    if (!newModuleName.trim()) {
      errors.name = 'O nome da disciplina é obrigatório.'
    }
    if (!newModuleStatus) {
      errors.status = 'O status é obrigatório.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await pb.collection('project_modules').create({
        name: newModuleName,
        project: projectId,
        status: newModuleStatus,
        progress: 0,
      })
      setNewModuleName('')
      setNewModuleStatus('Pendente')
      toast({ title: 'Módulo adicionado' })
    } catch (e) {
      setFieldErrors(extractFieldErrors(e))
      toast({
        title: 'Erro ao adicionar módulo',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
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
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-medium">Adicionar Nova Disciplina</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-start">
            <div className="flex-1 w-full space-y-1">
              <Input
                placeholder="Nome da nova disciplina..."
                value={newModuleName}
                onChange={(e) => {
                  setNewModuleName(e.target.value)
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className={cn(
                  fieldErrors.name && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="w-full sm:w-[200px] space-y-1">
              <Select
                value={newModuleStatus}
                onValueChange={(v: ProjectModule['status']) => {
                  setNewModuleStatus(v)
                  if (fieldErrors.status) setFieldErrors((prev) => ({ ...prev, status: '' }))
                }}
              >
                <SelectTrigger
                  className={cn(fieldErrors.status && 'border-destructive focus:ring-destructive')}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-xs text-destructive">{fieldErrors.status}</p>
              )}
            </div>
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
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
                    <TableCell className="font-medium">
                      <Link
                        to={`/projects/${projectId}/disciplines/${mod.id}`}
                        className="text-primary hover:underline"
                      >
                        {mod.name}
                      </Link>
                    </TableCell>
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
