import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { GripVertical, Trash2, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProjectNotesList({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchNotes = async () => {
    try {
      const records = await pb.collection('user_notes').getFullList({
        filter: `project = "${projectId}"`,
        sort: 'ordem,created',
        expand: 'user',
      })
      setNotes(records)
    } catch (err) {
      console.error('Failed to fetch project notes', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) fetchNotes()
  }, [projectId])

  useRealtime('user_notes', () => {
    fetchNotes()
  })

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'

    if (e.currentTarget instanceof HTMLElement) {
      setTimeout(() => {
        ;(e.target as HTMLElement).classList.add('opacity-50')
      }, 0)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      ;(e.target as HTMLElement).classList.remove('opacity-50')
    }
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndexStr = e.dataTransfer.getData('text/plain')
    if (!sourceIndexStr) return
    const sourceIndex = parseInt(sourceIndexStr, 10)
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return

    const newNotes = [...notes]
    const [movedNote] = newNotes.splice(sourceIndex, 1)
    newNotes.splice(targetIndex, 0, movedNote)

    // Optimistic update
    setNotes(newNotes)

    try {
      const promises = newNotes.map((note, i) => {
        if (note.ordem !== i) {
          note.ordem = i
          return pb.collection('user_notes').update(note.id, { ordem: i })
        }
        return Promise.resolve()
      })
      await Promise.all(promises)
    } catch (err) {
      console.error('Failed to update note order', err)
      fetchNotes() // Revert on failure
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const deleteNote = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota?')) return

    try {
      await pb.collection('user_notes').delete(id)
    } catch (err) {
      console.error('Failed to delete note', err)
    }
  }

  if (!projectId) return null

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Notas do Projeto</h3>
      </div>

      <div className="space-y-3 w-full">
        {loading ? (
          <div className="animate-pulse space-y-3 w-full">
            <div className="h-24 w-full bg-muted rounded-xl"></div>
            <div className="h-24 w-full bg-muted rounded-xl"></div>
          </div>
        ) : notes.length === 0 ? (
          <Card className="bg-muted/30 border-dashed shadow-none">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              Nenhuma nota encontrada para este projeto.
            </CardContent>
          </Card>
        ) : (
          notes.map((note, index) => (
            <Card
              key={note.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                'w-full bg-card hover:bg-accent/10 transition-colors border shadow-sm group',
                'cursor-grab active:cursor-grabbing',
              )}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors mt-1 touch-none flex flex-col justify-center h-full">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 w-full overflow-hidden min-w-0">
                  {note.rich_content ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none break-words"
                      dangerouslySetInnerHTML={{ __html: note.rich_content }}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
                  )}
                  {note.expand?.user && (
                    <p className="text-xs text-muted-foreground mt-3 font-medium">
                      Por: {note.expand.user.name || note.expand.user.email}
                    </p>
                  )}
                </div>

                {user?.id === note.user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    title="Excluir nota"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
