import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export interface ProjectNoteModalProps {
  projectId: string
  noteId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function ProjectNoteModal({
  projectId,
  noteId,
  open,
  onOpenChange,
  onSaved,
}: ProjectNoteModalProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open && noteId) {
      setLoading(true)
      pb.collection('user_notes')
        .getOne(noteId)
        .then((record) => {
          setContent(record.content || '')
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar a anotação.',
            variant: 'destructive',
          })
        })
        .finally(() => setLoading(false))
    } else if (open && !noteId) {
      setContent('')
    }
  }, [open, noteId, toast])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const data = {
        project: projectId,
        content,
        user: user.id,
        last_editor: user.id,
        category: 'Geral',
      }

      if (noteId) {
        await pb.collection('user_notes').update(noteId, data)
      } else {
        await pb.collection('user_notes').create(data)
      }

      toast({ title: 'Sucesso', description: 'Anotação salva com sucesso.' })
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar a anotação.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full !overflow-visible max-h-none p-6 md:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">
            {noteId ? 'Editar Anotação do Projeto' : 'Nova Anotação do Projeto'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px] sm:min-h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva suas anotações detalhadas aqui..."
              className="min-h-[400px] sm:min-h-[50vh] text-base p-4 resize-y leading-relaxed focus-visible:ring-primary/50"
            />
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
