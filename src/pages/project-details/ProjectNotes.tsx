import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, ArrowDown, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const { user } = useAuth()
  const { toast } = useToast()

  const loadNotes = async () => {
    try {
      const filter = [`project = "${projectId}"`, search ? `content ~ "${search}"` : '']
        .filter(Boolean)
        .join(' && ')

      const records = await pb.collection('user_notes').getFullList({
        filter,
        sort: sort === 'desc' ? '-created' : 'created',
        expand: 'user',
      })
      setNotes(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    // Basic debounce for search
    const timer = setTimeout(() => {
      loadNotes()
    }, 300)
    return () => clearTimeout(timer)
  }, [projectId, search, sort])

  useRealtime('user_notes', (e) => {
    if (e.record.project === projectId) {
      loadNotes()
    }
  })

  const handleAdd = async () => {
    if (!newNote.trim() || !user) return
    try {
      await pb.collection('user_notes').create({
        project: projectId,
        content: newNote,
        user: user.id,
      })
      setNewNote('')
    } catch (e) {
      toast({ title: 'Erro ao adicionar anotação', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30 p-2 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar anotações..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais Recentes</SelectItem>
              <SelectItem value="asc">Mais Antigas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Escreva uma nova anotação... (suporta quebras de linha)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] resize-y"
        />
        <Button onClick={handleAdd} className="h-[80px] px-4">
          <Send className="w-4 h-4 mr-2" /> Salvar
        </Button>
      </div>

      <div className="space-y-4 mt-6 overflow-y-auto pr-2 pb-4">
        {notes.map((note) => (
          <Card key={note.id} className="shadow-sm border-l-4 border-l-primary/60">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {note.expand?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {note.expand?.user?.name || 'Usuário'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(note.created).toLocaleString('pt-BR')}
              </span>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                {note.content}
              </p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            {search ? 'Nenhuma anotação corresponde à busca.' : 'Nenhuma anotação encontrada.'}
          </div>
        )}
      </div>
    </div>
  )
}
