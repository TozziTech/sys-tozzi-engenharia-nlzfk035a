import { useState, useEffect, useCallback, useRef } from 'react'
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
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

  const [lastEditor, setLastEditor] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [lastEditDate, setLastEditDate] = useState<Date | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isFocusedRef = useRef(false)
  const isDirtyRef = useRef(false)
  const isDirty = content !== initialContent || category !== initialCategory

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const loadNote = useCallback(
    async (force = false) => {
      if (!user) return
      if (isFocusedRef.current && !force) return
      if (isDirtyRef.current && !force) return
      try {
        const filter = projectId
          ? `project = "${projectId}"`
          : `user = "${user.id}" && project = ""`

        const result = await pb.collection('user_notes').getList(1, 1, {
          filter,
          sort: 'created',
          expand: 'last_editor,user',
        })

        if (isFocusedRef.current && !force) return
        if (isDirtyRef.current && !force) return

        if (result.items && result.items.length > 0) {
          const note = result.items[0]
          setNoteId(note.id)
          setContent(note.content || '')
          setInitialContent(note.content || '')
          setCategory(note.category || 'Geral')
          setInitialCategory(note.category || 'Geral')

          setLastEditor(note.expand?.last_editor?.name || null)
          setCreatorName(note.expand?.user?.name || null)
          setLastEditDate(note.updated ? new Date(note.updated) : null)
        } else {
          setNoteId(null)
          setContent('')
          setInitialContent('')
          setCategory('Geral')
          setInitialCategory('Geral')
          setLastEditor(null)
          setCreatorName(null)
          setLastEditDate(null)
        }
        setIsLoaded(true)
      } catch (err) {
        console.error('Error loading note:', err)
        setIsLoaded(true)
      }
    },
    [user, projectId],
  )

  useEffect(() => {
    loadNote(true)
  }, [loadNote])

  const fetchEditorNames = useCallback(async (record: any) => {
    try {
      const result = await pb.collection('user_notes').getOne(record.id, {
        expand: 'last_editor,user',
      })
      setLastEditor(result.expand?.last_editor?.name || null)
      setCreatorName(result.expand?.user?.name || null)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useRealtime('user_notes', (e) => {
    const eProject = e.record.project || undefined
    const isMatch = projectId ? eProject === projectId : !eProject && e.record.user === user?.id

    if (isMatch) {
      const isOwnUpdate = e.record.last_editor === user?.id
      if (isOwnUpdate) return

      if (isFocusedRef.current) return
      if (isDirtyRef.current) return

      setNoteId(e.record.id)
      setContent(e.record.content || '')
      setInitialContent(e.record.content || '')
      setCategory(e.record.category || 'Geral')
      setInitialCategory(e.record.category || 'Geral')
      setLastEditDate(e.record.updated ? new Date(e.record.updated) : null)

      fetchEditorNames(e.record)
    }
  })

  const handleSave = async () => {
    if (!isLoaded || !isDirty) return

    setIsSaving(true)
    try {
      const data = {
        user: user?.id,
        content,
        category,
        ...(projectId ? { project: projectId } : { project: null }),
      }

      const saveData = {
        ...data,
        last_editor: user?.id,
      }

      if (noteId) {
        // Prevent overwriting the original creator on update
        delete saveData.user
        await pb.collection('user_notes').update(noteId, saveData)
      } else {
        const record = await pb.collection('user_notes').create(saveData)
        setNoteId(record.id)
        setCreatorName(user?.name || null)
      }

      setLastEditor(user?.name || null)
      setLastEditDate(new Date())

      setInitialContent(content)
      setInitialCategory(category)
      setLastSaved(new Date())

      toast({
        title: 'Anotação salva',
        description: 'Suas alterações foram salvas com sucesso.',
      })
    } catch (err) {
      console.error('Error saving note:', err)
      toast({ title: 'Erro ao salvar anotação', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

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
              <span className="flex items-center gap-1.5 justify-end text-blue-500">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Salvando...
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1.5 justify-end text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Alterações pendentes
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 justify-end text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Salvo
              </span>
            ) : null}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            Salvar
          </Button>

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
          <CardContent className="flex-1 flex flex-col min-h-[300px] overflow-hidden gap-2">
            <RichTextEditor
              value={content}
              onChange={setContent}
              onFocus={() => {
                isFocusedRef.current = true
              }}
              onBlur={() => {
                isFocusedRef.current = false
              }}
              className="flex-1 overflow-hidden h-full"
            />
            {(noteId || lastEditor || creatorName) && (
              <div className="text-xs text-muted-foreground pt-2 border-t mt-auto text-left">
                {lastEditor ? (
                  <>
                    Última edição por:{' '}
                    <span className="font-medium text-foreground/80">{lastEditor}</span>
                  </>
                ) : creatorName ? (
                  <>
                    Criado por:{' '}
                    <span className="font-medium text-foreground/80">{creatorName}</span>
                  </>
                ) : null}
                {lastEditDate && ` há ${formatDistanceToNow(lastEditDate, { locale: ptBR })}`}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        {' '}
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
                onFocus={() => {
                  isFocusedRef.current = true
                }}
                onBlur={() => {
                  isFocusedRef.current = false
                }}
                className="flex-1 border-0 rounded-none h-full overflow-hidden"
              />
              {(noteId || lastEditor || creatorName) && (
                <div className="text-xs text-muted-foreground py-2 px-4 border-t bg-muted/5 shrink-0">
                  {lastEditor ? (
                    <>
                      Última edição por:{' '}
                      <span className="font-medium text-foreground/80">{lastEditor}</span>
                    </>
                  ) : creatorName ? (
                    <>
                      Criado por:{' '}
                      <span className="font-medium text-foreground/80">{creatorName}</span>
                    </>
                  ) : null}
                  {lastEditDate && ` há ${formatDistanceToNow(lastEditDate, { locale: ptBR })}`}
                </div>
              )}
            </div>
          )}
        </DialogContent>{' '}
      </Dialog>
    </div>
  )
}
