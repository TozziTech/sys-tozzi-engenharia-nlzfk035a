import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

interface ProjectNotesModalProps {
  projectId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaveSuccess?: () => void
}

export function ProjectNotesModal({
  projectId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSaveSuccess,
}: ProjectNotesModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open && projectId) {
      loadNotes()
    }
  }, [open, projectId])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const record = await pb
        .collection('user_notes')
        .getFirstListItem(`project="${projectId}" && category="project_notes"`)

      setNotes(record.content || '')
      setNoteId(record.id)
    } catch (error: any) {
      try {
        const fallbackRecord = await pb
          .collection('user_notes')
          .getFirstListItem(`project="${projectId}"`)
        setNotes(fallbackRecord.content || '')
        setNoteId(fallbackRecord.id)
      } catch (e) {
        setNotes('')
        setNoteId(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      if (noteId) {
        await pb.collection('user_notes').update(noteId, {
          content: notes,
          last_editor: user.id,
        })
      } else {
        await pb.collection('user_notes').create({
          project: projectId,
          user: user.id,
          content: notes,
          last_editor: user.id,
          category: 'project_notes',
        })
      }
      toast({
        title: 'Sucesso',
        description: 'Anotações do projeto salvas com sucesso.',
      })
      setOpen(false)
      onSaveSuccess?.()
    } catch (error: any) {
      console.error('Error saving notes:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as anotações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">Editar anotações do projeto</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl w-[95vw] md:w-full flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="text-xl md:text-2xl">Anotações do Projeto</DialogTitle>
          <DialogDescription>
            Visualize e edite as anotações detalhadas deste projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Digite as anotações do projeto aqui..."
            className="min-h-[50vh] w-full resize-none focus-visible:ring-1 text-base md:text-lg leading-relaxed bg-background shadow-sm"
            disabled={loading}
            autoResize
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background z-10 sm:justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
