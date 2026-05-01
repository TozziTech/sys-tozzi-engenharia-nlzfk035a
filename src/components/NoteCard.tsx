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
import { FileText, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NoteCard({ projectId }: { projectId?: string }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [noteId, setNoteId] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const localContentRef = useRef('')

  const [category, setCategory] = useState('Geral')

  const [lastEditor, setLastEditor] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [lastEditDate, setLastEditDate] = useState<Date | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isFocusedRef = useRef(false)
  const hasUnsavedChangesRef = useRef(false)

  const handleEditorChange = useCallback((val: string) => {
    setEditorContent(val)
    localContentRef.current = val
    hasUnsavedChangesRef.current = true
  }, [])

  const handleCategoryChange = useCallback((val: string) => {
    setCategory(val)
    hasUnsavedChangesRef.current = true
  }, [])

  const loadNote = useCallback(
    async (force = false) => {
      if (!user) return
      if (isFocusedRef.current && !force) return
      if (hasUnsavedChangesRef.current && !force) return

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
        if (hasUnsavedChangesRef.current && !force) return

        if (result.items && result.items.length > 0) {
          const note = result.items[0]
          const newContent = note.content || ''
          setNoteId(note.id)
          setEditorContent(newContent)
          localContentRef.current = newContent

          const newCat = note.category || 'Geral'
          setCategory(newCat)

          setLastEditor(note.expand?.last_editor?.name || null)
          setCreatorName(note.expand?.user?.name || null)
          setLastEditDate(note.updated ? new Date(note.updated) : null)
        } else {
          setNoteId(null)
          setEditorContent('')
          localContentRef.current = ''
          setCategory('Geral')
          setLastEditor(null)
          setCreatorName(null)
          setLastEditDate(null)
        }
        setIsLoaded(true)
        hasUnsavedChangesRef.current = false
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

  const handleSave = async () => {
    if (!isLoaded) return

    setIsSaving(true)
    try {
      const payloadContent = localContentRef.current
      const payloadCategory = category

      const data = {
        user: user?.id,
        content: payloadContent,
        category: payloadCategory,
        ...(projectId ? { project: projectId } : { project: null }),
        last_editor: user?.id,
      }

      let record
      if (noteId) {
        delete data.user
        record = await pb.collection('user_notes').update(noteId, data)
      } else {
        record = await pb.collection('user_notes').create(data)
        setNoteId(record.id)
        setCreatorName(user?.name || null)
      }

      setLastEditor(user?.name || null)
      setLastEditDate(new Date())

      setEditorContent(payloadContent)
      localContentRef.current = payloadContent
      hasUnsavedChangesRef.current = false

      toast({
        title: 'Anotação salva',
        description: 'Suas alterações foram salvas com sucesso.',
      })
    } catch (err) {
      console.error('Error saving note:', err)
      toast({
        title: 'Erro ao salvar anotação',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'transition-all duration-200',
          isFullscreen
            ? 'fixed inset-4 md:inset-10 z-[100] flex flex-col bg-background shadow-2xl rounded-xl border border-border overflow-hidden'
            : 'w-full',
        )}
      >
        <Card
          className={cn(
            'w-full shadow-sm flex flex-col border-primary/10',
            isFullscreen ? 'h-full border-0 rounded-none' : '',
          )}
        >
          <CardHeader
            className={cn('shrink-0', isFullscreen ? 'p-4 border-b bg-muted/30 pb-4' : 'pb-3')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {projectId ? 'Notas do Projeto' : 'Bloco de Notas'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {projectId
                    ? 'Suas anotações privadas para este projeto.'
                    : 'Anotações gerais e rascunhos.'}
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Select value={category} onValueChange={handleCategoryChange}>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2"
                    onClick={handleSave}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={isSaving}
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
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent
            className={cn(
              'flex-1 flex flex-col overflow-hidden gap-2',
              isFullscreen ? 'p-0' : 'min-h-[300px]',
            )}
          >
            <RichTextEditor
              value={editorContent}
              onChange={handleEditorChange}
              onFocus={() => {
                isFocusedRef.current = true
              }}
              onBlur={() => {
                isFocusedRef.current = false
              }}
              disabled={isSaving}
              className={cn(
                'flex-1 overflow-hidden h-full',
                isFullscreen ? 'border-0 rounded-none' : '',
              )}
            />
            {(noteId || lastEditor || creatorName) && (
              <div
                className={cn(
                  'text-xs text-muted-foreground pt-2 border-t mt-auto text-left',
                  isFullscreen ? 'px-4 py-2 bg-muted/5 shrink-0' : '',
                )}
              >
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
        </Card>
      </div>
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90]"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  )
}
