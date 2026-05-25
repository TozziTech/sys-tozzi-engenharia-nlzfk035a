import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Bold, Underline, Strikethrough } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

function RichTextEditor({
  initialHTML,
  onChange,
}: {
  initialHTML: string
  onChange: (h: string, t: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== initialHTML &&
      document.activeElement !== editorRef.current
    ) {
      editorRef.current.innerHTML = initialHTML || ''
    }
  }, [initialHTML])

  const formatDoc = (cmd: string) => {
    document.execCommand(cmd, false, '')
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML, editorRef.current.innerText)
      editorRef.current.focus()
    }
  }

  return (
    <div className="border rounded-md flex flex-col w-full flex-1 overflow-hidden">
      <div className="flex items-center gap-1 p-1 bg-muted/30 border-b shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => formatDoc('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => formatDoc('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => formatDoc('strikeThrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="flex-1 p-4 outline-none prose dark:prose-invert max-w-none overflow-y-auto"
        onInput={(e) => onChange(e.currentTarget.innerHTML, e.currentTarget.innerText)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML, e.currentTarget.innerText)}
      />
    </div>
  )
}

export function ProjectNotes({ projectId, enabled }: { projectId: string; enabled?: boolean }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<any>(null)

  const [title, setTitle] = useState('')
  const [richContent, setRichContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!projectId || !pb.authStore.isValid) return
    try {
      setNotes(
        await pb
          .collection('user_notes')
          .getFullList({ filter: `project = "${projectId}"`, sort: '-created', expand: 'user' }),
      )
    } catch (e) {
      console.error(e)
    }
  }, [projectId])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])
  useRealtime('user_notes', loadNotes, enabled)

  const handleOpenModal = (note?: any) => {
    setEditingNote(note || null)
    setTitle(note?.category || '')
    setRichContent(note?.rich_content || note?.content || '')
    setTextContent(note?.content || '')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return toast({ title: 'O título é obrigatório', variant: 'destructive' })
    setIsSaving(true)
    try {
      const data = {
        project: projectId,
        user: editingNote ? editingNote.user : user?.id,
        category: title,
        rich_content: richContent,
        content: textContent,
        last_editor: user?.id,
      }
      if (editingNote) await pb.collection('user_notes').update(editingNote.id, data)
      else await pb.collection('user_notes').create(data)
      toast({ title: editingNote ? 'Nota atualizada' : 'Nota criada' })
      setIsModalOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta nota?')) return
    try {
      await pb.collection('user_notes').delete(id)
      toast({ title: 'Nota excluída' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Anotações do Projeto</h3>
          <p className="text-sm text-muted-foreground">Registre informações e detalhes.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground">
            Nenhuma anotação registrada.
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="flex flex-col h-[280px]">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate" title={note.category}>
                    {note.category}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1 truncate">
                    Por {note.expand?.user?.name || 'Usuário'} •{' '}
                    {new Date(note.created).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenModal(note)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto custom-scrollbar">
                <div
                  className="text-sm prose dark:prose-invert prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: note.rich_content || note.content || '' }}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-4 shrink-0 border-b bg-background z-10">
            <DialogTitle>{editingNote ? 'Editar Nota' : 'Nova Nota'}</DialogTitle>
            <DialogDescription>
              Use as ferramentas de formatação para destacar o texto.
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <div className="space-y-2 shrink-0">
              <Label htmlFor="note-title">Título / Categoria</Label>
              <Input
                id="note-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Requisitos do Cliente..."
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
              <Label>Conteúdo da Nota</Label>
              <RichTextEditor
                initialHTML={
                  editingNote ? editingNote.rich_content || editingNote.content || '' : ''
                }
                onChange={(html, text) => {
                  setRichContent(html)
                  setTextContent(text)
                }}
              />
            </div>
          </div>

          <div className="p-4 shrink-0 border-t bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Nota'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
