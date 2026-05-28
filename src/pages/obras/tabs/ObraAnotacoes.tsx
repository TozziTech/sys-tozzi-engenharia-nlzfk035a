import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'

export function ObraAnotacoes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [content, setContent] = useState('')
  const { user } = useAuth()

  const fetchNotes = async () => {
    const data = await pb.collection('user_notes').getFullList({
      filter: `project = "${projectId}"`,
      expand: 'user',
      sort: '-created',
    })
    setNotes(data)
  }

  useEffect(() => {
    fetchNotes()
  }, [projectId])
  useRealtime('user_notes', fetchNotes)

  const handlePost = async () => {
    if (!content.trim()) return
    try {
      await pb.collection('user_notes').create({
        project: projectId,
        user: user.id,
        content,
        category: 'Diário de Obra',
      })
      setContent('')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Escreva uma nova anotação ou entrada no diário de obra..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-end">
            <Button onClick={handlePost}>Publicar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {note.expand?.user?.name || 'Usuário'}
                </span>
                <span>{format(new Date(note.created), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma anotação ainda.</p>
        )}
      </div>
    </div>
  )
}
