import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Save, Edit2, Trash2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useRealtime } from '@/hooks/use-realtime'
import { ProjectInternalChecklist } from './ProjectInternalChecklist'

interface Note {
  id: string
  content: string
  created: string
  updated: string
  user: string
  last_editor: string
  expand?: {
    user?: { name: string; email: string }
    last_editor?: { name: string; email: string }
  }
}

export function ProjectNotes({ projectId, enabled }: { projectId: string; enabled: boolean }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newContent, setNewContent] = useState('')

  const loadNotes = useCallback(async () => {
    if (!projectId || !pb.authStore.isValid) return
    try {
      const records = await pb.collection('user_notes').getFullList({
        filter: `project = "${projectId}"`,
        sort: '-created',
        expand: 'user,last_editor',
      })
      setNotes(records as any)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useRealtime('user_notes', loadNotes, enabled)

  const handleCreate = async () => {
    if (!newContent.trim()) return
    try {
      await pb.collection('user_notes').create({
        content: newContent,
        project: projectId,
        user: user?.id,
        last_editor: user?.id,
        category: 'Anotações',
      })
      setNewContent('')
      setIsCreating(false)
      toast({ title: 'Anotação salva', description: 'Sua nota foi criada com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro ao criar nota', variant: 'destructive' })
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await pb.collection('user_notes').update(id, {
        content: editContent,
        last_editor: user?.id,
      })
      setEditingId(null)
      toast({
        title: 'Anotação atualizada',
        description: 'As alterações foram salvas com sucesso.',
      })
    } catch (error) {
      toast({ title: 'Erro ao atualizar nota', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return
    try {
      await pb.collection('user_notes').delete(id)
      toast({ title: 'Anotação excluída', description: 'Sua nota foi removida do projeto.' })
    } catch (error) {
      toast({ title: 'Erro ao excluir nota', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Anotações do Projeto</h3>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Nova Anotação
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="border-primary/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Criar nova anotação</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Digite sua anotação sobre o projeto aqui..."
                className="min-h-[120px] resize-y"
                autoFocus
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!newContent.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </CardFooter>
          </Card>
        )}

        {notes.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-muted/20 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">
              Nenhuma anotação encontrada para este projeto.
            </p>
            <Button variant="link" onClick={() => setIsCreating(true)} className="mt-2">
              Criar a primeira anotação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id}>
                {editingId === note.id ? (
                  <>
                    <CardContent className="pt-6">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[120px] resize-y"
                        autoFocus
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editContent.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <CardContent className="pt-6">
                      <div className="whitespace-pre-wrap text-sm">{note.content}</div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 bg-muted/20 border-t text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span>
                            Criado por:{' '}
                            <span className="font-medium text-foreground">
                              {note.expand?.user?.name || 'Usuário'}
                            </span>{' '}
                            em {format(new Date(note.created), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        {note.last_editor && note.updated !== note.created && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Última edição:{' '}
                              <span className="font-medium text-foreground">
                                {note.expand?.last_editor?.name || 'Usuário'}
                              </span>{' '}
                              em {format(new Date(note.updated), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setEditContent(note.content)
                            setEditingId(note.id)
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-6">
        <ProjectInternalChecklist projectId={projectId} enabled={enabled} />
      </div>
    </div>
  )
}
