import { useState, useEffect, useRef } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export interface UserNote {
  id: string
  content: string
  rich_content: string
  category: string
  project: string
  created: string
  updated: string
  ordem: number
}

interface ProjectNotesListProps {
  projectId: string
}

export function ProjectNotesList({ projectId }: ProjectNotesListProps) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    isDraggingRef.current = draggingId !== null
  }, [draggingId])

  const fetchNotes = async () => {
    try {
      const records = await pb.collection('user_notes').getFullList<UserNote>({
        filter: `project = '${projectId}'`,
        sort: 'ordem,created',
      })
      setNotes(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [projectId])

  useRealtime('user_notes', (e) => {
    if (e.record.project !== projectId) return
    if (isDraggingRef.current) return
    fetchNotes()
  })

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)

    setTimeout(() => {
      const el = document.getElementById(`note-${id}`)
      if (el) el.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggingId(null)
    setDragOverId(null)
    const el = document.getElementById(`note-${id}`)
    if (el) el.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== dragOverId) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)

    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      return
    }

    const newNotes = [...notes]
    const draggedIndex = newNotes.findIndex((n) => n.id === draggingId)
    const targetIndex = newNotes.findIndex((n) => n.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggingId(null)
      return
    }

    const [draggedNote] = newNotes.splice(draggedIndex, 1)
    newNotes.splice(targetIndex, 0, draggedNote)

    const updatedNotes = newNotes.map((note, index) => ({
      ...note,
      ordem: index + 1,
    }))

    setNotes(updatedNotes)
    setDraggingId(null)

    try {
      await Promise.all(
        updatedNotes.map((note) =>
          pb.collection('user_notes').update(note.id, { ordem: note.ordem }),
        ),
      )
    } catch (err) {
      console.error('Failed to update order', err)
      fetchNotes()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 w-full">
        <div className="h-24 w-full animate-pulse bg-muted rounded-lg border" />
        <div className="h-24 w-full animate-pulse bg-muted rounded-lg border" />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border border-dashed rounded-lg bg-card/50">
        Nenhuma nota encontrada para este projeto.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {notes.map((note) => (
        <div
          key={note.id}
          id={`note-${note.id}`}
          draggable
          onDragStart={(e) => handleDragStart(e, note.id)}
          onDragEnd={(e) => handleDragEnd(e, note.id)}
          onDragOver={(e) => handleDragOver(e, note.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, note.id)}
          className={cn(
            'group flex items-start gap-4 p-4 bg-card rounded-lg border shadow-sm transition-all duration-200 w-full relative',
            draggingId === note.id
              ? 'opacity-50 border-primary ring-1 ring-primary/20'
              : 'opacity-100',
            dragOverId === note.id &&
              draggingId !== note.id &&
              'border-primary/50 bg-accent/50 translate-y-1',
          )}
        >
          <div
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground mt-1 transition-colors"
            title="Arraste para reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            {note.category && (
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {note.category}
              </div>
            )}
            {note.rich_content ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed"
                dangerouslySetInnerHTML={{ __html: note.rich_content }}
              />
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                {note.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
