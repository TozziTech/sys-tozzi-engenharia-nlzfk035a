import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, User, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState<any>(null)
  const [editorContent, setEditorContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchNotes = async () => {
    try {
      const records = await pb.collection('user_notes').getFullList({
        filter: `project = "${projectId}"`,
        sort: '-created',
        expand: 'user,last_editor',
      })
      setNotes(records)
    } catch (error) {
      console.error('Error fetching notes', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchNotes()
    }
  }, [projectId])

  useRealtime('user_notes', (e) => {
    if (e.record.project === projectId) {
      fetchNotes()
    }
  })

  const handleSave = async () => {
    if (!user) return
    if (!editorContent.trim() || editorContent === '<br>') {
      toast({ title: 'Anotação não pode estar vazia', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const data = {
        project: projectId,
        content: editorContent,
        last_editor: user.id,
        user: currentNote ? currentNote.user : user.id, // Keep original author
      }

      if (currentNote) {
        await pb.collection('user_notes').update(currentNote.id, data)
        toast({ title: 'Anotação atualizada com sucesso!' })
      } else {
        await pb.collection('user_notes').create(data)
        toast({ title: 'Anotação criada com sucesso!' })
      }

      setIsModalOpen(false)
      setCurrentNote(null)
      setEditorContent('')
    } catch (error) {
      console.error('Error saving note', error)
      toast({ title: 'Erro ao salvar anotação', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta anotação?')) {
      try {
        await pb.collection('user_notes').delete(id)
        toast({ title: 'Anotação excluída com sucesso!' })
      } catch (error) {
        console.error('Error deleting note', error)
        toast({ title: 'Erro ao excluir anotação', variant: 'destructive' })
      }
    }
  }

  const openEditor = (note?: any) => {
    setCurrentNote(note || null)
    let content = note?.content || ''

    // Convert old plain text notes to HTML gracefully
    if (content && !content.includes('<') && !content.includes('>')) {
      content = `<p>${content.replace(/\n/g, '<br/>')}</p>`
    }

    setEditorContent(content)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium tracking-tight">Anotações do Projeto</h3>
          <p className="text-sm text-muted-foreground">
            Registre documentações, feedbacks e observações importantes.
          </p>
        </div>
        <Button onClick={() => openEditor()} size="sm" className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nova Anotação
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
            <DialogTitle className="text-xl">
              {currentNote ? 'Editar Anotação' : 'Nova Anotação'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 bg-muted/5" style={{ height: 'calc(90vh - 140px)' }}>
            <div className="p-6">
              <RichTextEditor
                value={editorContent}
                onChange={setEditorContent}
                placeholder="Escreva o conteúdo da sua anotação aqui. Utilize as opções de formatação acima..."
                minHeight="min-h-[400px]"
                className="bg-card shadow-sm border"
              />
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-muted/10 shrink-0 flex items-center sm:justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
              {isSaving ? 'Salvando...' : 'Salvar Anotação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse border rounded-lg bg-muted/10">
          Carregando anotações...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5 flex flex-col items-center justify-center">
          <p className="mb-4">Nenhuma anotação encontrada para este projeto.</p>
          <Button variant="outline" onClick={() => openEditor()}>
            Criar Primeira Anotação
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border rounded-xl p-5 flex flex-col bg-card shadow-sm hover:shadow-md transition-shadow group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm font-medium text-foreground">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {note.expand?.user?.name || 'Usuário desconhecido'}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(note.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {note.expand?.last_editor &&
                      note.expand.last_editor.id !== note.expand.user?.id && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            Editado por {note.expand.last_editor.name}
                          </Badge>
                        </>
                      )}
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-card/80 backdrop-blur-sm rounded-md shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => openEditor(note)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 bg-muted/20 rounded-md p-4 border border-muted/50">
                <ScrollArea className="h-[180px] pr-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none break-words [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: note.content || '' }}
                  />
                </ScrollArea>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
