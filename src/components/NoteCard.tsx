import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { FileText, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function NoteCard({ projectId }: { projectId?: string }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [noteId, setNoteId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [initialContent, setInitialContent] = useState('')
  const [category, setCategory] = useState('Geral')
  const [initialCategory, setInitialCategory] = useState('Geral')

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadNote = useCallback(async () => {
    if (!user) return
    try {
      const filter = `user = "${user.id}" && project ${projectId ? `= "${projectId}"` : `= ""`}`
      const result = await pb.collection('user_notes').getList(1, 1, { filter })

      if (result.items && result.items.length > 0) {
        const note = result.items[0]
        setNoteId(note.id)
        setContent(note.content || '')
        setInitialContent(note.content || '')
        setCategory(note.category || 'Geral')
        setInitialCategory(note.category || 'Geral')
      } else {
        setNoteId(null)
        setContent('')
        setInitialContent('')
        setCategory('Geral')
        setInitialCategory('Geral')
      }
      setIsLoaded(true)
    } catch (err) {
      console.error('Error loading note:', err)
      setIsLoaded(true)
    }
  }, [user, projectId])

  useEffect(() => {
    loadNote()
  }, [loadNote])

  useRealtime('user_notes', (e) => {
    if (e.record.user === user?.id) {
      const eProject = e.record.project || undefined
      const isMatch = projectId ? eProject === projectId : !eProject
      if (isMatch) {
        loadNote()
      }
    }
  })

  useEffect(() => {
    if (!isLoaded || (content === initialContent && category === initialCategory)) return

    const timeoutId = setTimeout(async () => {
      setIsSaving(true)
      try {
        const data = {
          user: user?.id,
          content,
          category,
          ...(projectId ? { project: projectId } : { project: null }),
        }

        if (noteId) {
          await pb.collection('user_notes').update(noteId, data)
        } else {
          const record = await pb.collection('user_notes').create(data)
          setNoteId(record.id)
        }

        setInitialContent(content)
        setInitialCategory(category)
        setLastSaved(new Date())
      } catch (err) {
        console.error('Error saving note:', err)
        toast({ title: 'Erro ao salvar anotação', variant: 'destructive' })
      } finally {
        setIsSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [content, initialContent, category, initialCategory, noteId, user, isLoaded, projectId, toast])

  const EditorHeader = ({ inDialog }: { inDialog?: boolean }) => (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        inDialog ? 'p-4 border-b bg-muted/30' : '',
      )}
    >
      <div className="space-y-1 flex-1">
        <div className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {projectId ? 'Notas do Projeto' : 'Bloco de Notas'}
        </div>
        <div className="text-sm text-muted-foreground">
          {projectId
            ? 'Suas anotações privadas para este projeto.'
            : 'Anotações gerais e rascunhos salvos automaticamente.'}
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Geral">Geral</SelectItem>
            <SelectItem value="Pessoal">Pessoal</SelectItem>
            <SelectItem value="Projetos">Projetos</SelectItem>
            <SelectItem value="Lembretes">Lembretes</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground whitespace-nowrap min-w-[80px] text-right">
            {isSaving ? (
              <span className="flex items-center gap-1.5 justify-end">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Salvando...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 justify-end">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Salvo
              </span>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Minimizar' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <Card className="w-full shadow-sm border-primary/10 flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <EditorHeader />
        </CardHeader>
        {!isFullscreen && (
          <CardContent className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
            <RichTextEditor
              value={content}
              onChange={setContent}
              className="flex-1 overflow-hidden h-full"
            />
          </CardContent>
        )}
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col gap-0 border-none shadow-2xl overflow-hidden rounded-xl"
          aria-describedby="fullscreen-editor"
        >
          <DialogTitle className="sr-only">Editor em Tela Cheia</DialogTitle>
          <DialogDescription className="sr-only" id="fullscreen-editor">
            Modo de tela cheia do editor de texto para anotações do usuário.
          </DialogDescription>
          <EditorHeader inDialog />
          {isFullscreen && (
            <div className="flex-1 overflow-hidden flex flex-col p-0">
              <RichTextEditor
                value={content}
                onChange={setContent}
                className="border-0 rounded-none h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
