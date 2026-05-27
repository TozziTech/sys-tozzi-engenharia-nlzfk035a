import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getProjectNotes, createNote, updateNote, deleteNote } from '@/services/user_notes'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Trash2, Edit2, Check, X, Send } from 'lucide-react'
import { format } from 'date-fns'

export function ProjectNotes({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('-created')
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const loadNotes = async () => {
    try {
      const data = await getProjectNotes(projectId)
      setNotes(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [projectId])

  useRealtime('user_notes', () => {
    loadNotes()
  })

  const filteredNotes = notes
    .filter((n) => n.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === '-created') return new Date(b.created).getTime() - new Date(a.created).getTime()
      return new Date(a.created).getTime() - new Date(b.created).getTime()
    })

  const handleAdd = async () => {
    if (!newNote.trim() || !user) return
    await createNote({ project: projectId, user: user.id, content: newNote })
    setNewNote('')
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim() || !user) return
    await updateNote(id, { content: editContent, last_editor: user.id })
    setEditingId(null)
  }

  return (
    <div className="space-y-4 bg-background border rounded-lg p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b pb-5">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Anotações do Projeto</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nas anotações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-muted-foreground/20"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px] bg-muted/30 border-muted-foreground/20">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created">Mais Recentes</SelectItem>
              <SelectItem value="created">Mais Antigas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Textarea
          placeholder="Escreva uma nova anotação. Pressione Enter para quebrar a linha..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[100px] resize-y bg-muted/20 border-muted-foreground/20 focus-visible:ring-primary/30 text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={handleAdd} className="gap-2 shadow-sm font-medium">
            <Send className="h-4 w-4" />
            Salvar Anotação
          </Button>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className="overflow-hidden border-muted-foreground/20 transition-all hover:shadow-md"
          >
            <CardContent className="p-0">
              <div className="bg-muted/30 px-5 py-2.5 flex justify-between items-center border-b">
                <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">
                  {note.expand?.user?.name || note.expand?.user?.email || 'Usuário'} •{' '}
                  {format(new Date(note.created), "dd/MM/yyyy 'às' HH:mm")}
                </span>
                <div className="flex gap-1">
                  {editingId === note.id ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-green-500/10"
                        onClick={() => handleEdit(note.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-500/10"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => {
                          setEditingId(note.id)
                          setEditContent(note.content || '')
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {editingId === note.id ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[120px] bg-background text-sm"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-medium">
                    {note.content}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredNotes.length === 0 && (
          <div className="text-center p-12 text-muted-foreground border-2 rounded-xl border-dashed border-muted">
            <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit2 className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma anotação encontrada.</p>
            <p className="text-xs mt-1">
              Escreva algo acima para começar a registrar o histórico do projeto.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
