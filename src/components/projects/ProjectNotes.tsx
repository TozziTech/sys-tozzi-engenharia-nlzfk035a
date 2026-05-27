import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const { user } = useAuth()

  const loadNotes = async () => {
    try {
      const records = await pb.collection('user_notes').getFullList({
        filter: `project="${projectId}"`,
        sort: 'ordem,-created',
        expand: 'user,last_editor',
      })
      setNotes(records)
    } catch (err) {
      console.error('Error loading project notes:', err)
    }
  }

  useEffect(() => {
    if (projectId) loadNotes()
  }, [projectId])

  useRealtime('user_notes', () => {
    loadNotes()
  })

  return (
    <div className="flex flex-col gap-4 w-full">
      {notes.map((note) => (
        <Card key={note.id} className="w-full shadow-sm">
          <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>{note.expand?.user?.name || 'Usuário'}</span>
              <span className="text-xs font-normal text-muted-foreground/70">
                {format(new Date(note.created), 'dd/MM/yyyy HH:mm')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            {note.rich_content ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: note.rich_content }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {notes.length === 0 && (
        <div className="w-full text-center py-12 border border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Nenhuma anotação encontrada para este projeto.
          </p>
        </div>
      )}
    </div>
  )
}
