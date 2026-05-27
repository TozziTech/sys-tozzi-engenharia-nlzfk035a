import { useState, useEffect } from 'react'
import { Search, Calendar, User as UserIcon } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface Note {
  id: string
  content: string
  rich_content: string
  created: string
  user: string
  expand?: {
    user?: {
      name: string
      avatar?: string
    }
  }
}

export function ProjectNotesManager({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [loading, setLoading] = useState(true)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadNotes = async () => {
    if (!projectId) return
    try {
      const records = await pb.collection('user_notes').getFullList<Note>({
        filter: `project = "${projectId}"`,
        sort: sortOrder === 'newest' ? '-created' : '+created',
        expand: 'user',
      })
      setNotes(records)
    } catch (err) {
      console.error('Failed to load project notes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [projectId, sortOrder])

  useRealtime('user_notes', () => {
    loadNotes()
  })

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !projectId) return
    setIsSubmitting(true)
    try {
      await pb.collection('user_notes').create({
        content: newNoteContent,
        project: projectId,
        user: user?.id,
        category: 'Geral',
      })
      setNewNoteContent('')
      toast({ title: 'Anotação salva com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar anotação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (note.content && note.content.toLowerCase().includes(q)) ||
      (note.rich_content && note.rich_content.toLowerCase().includes(q))
    )
  })

  if (!projectId) return null

  return (
    <div className="space-y-6">
      {/* Note Creation Form */}
      <Card className="w-full shadow-sm border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Escreva uma nova anotação para o projeto..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[100px] resize-y"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} disabled={isSubmitting || !newNoteContent.trim()}>
              {isSubmitting ? 'Salvando...' : 'Adicionar Anotação'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Sort Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nas anotações do projeto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
            Ordenar:
          </span>
          <Select value={sortOrder} onValueChange={(val: 'newest' | 'oldest') => setSortOrder(val)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Recentes</SelectItem>
              <SelectItem value="oldest">Mais Antigas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">
            Carregando anotações...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
            {searchQuery
              ? 'Nenhuma anotação corresponde à sua busca.'
              : 'Nenhuma anotação encontrada neste projeto.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="w-full overflow-hidden border-border/70 hover:border-border transition-colors"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm border border-primary/20">
                      {note.expand?.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {note.expand?.user?.name || 'Usuário Desconhecido'}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.created).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note Content - Format Preservation */}
                <div className="mt-3 text-sm text-foreground/90 bg-muted/20 p-4 rounded-md border border-border/40 whitespace-pre-wrap leading-relaxed">
                  {note.rich_content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: note.rich_content }}
                      className="prose dark:prose-invert max-w-none text-sm"
                    />
                  ) : (
                    note.content
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
