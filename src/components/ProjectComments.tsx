import { useState, useRef, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Paperclip, Send, File as FileIcon, X, Loader2, Pencil, Trash2, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ProjectPresence } from '@/components/ProjectPresence'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ProjectComments({
  projectId,
  projectType = 'projects',
}: {
  projectId: string
  projectType?: 'projects' | 'projetos_cliente'
}) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [comments, setComments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filterField = projectType === 'projects' ? 'projeto_interno_id' : 'projeto_id'

  const loadData = async () => {
    try {
      const usersRes = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(usersRes)

      const commentsRes = await pb.collection('comentarios_projeto').getFullList({
        filter: `${filterField} = "${projectId}"`,
        expand: 'autor',
        sort: 'created',
      })
      setComments(commentsRes)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  useRealtime('comentarios_projeto', (e) => {
    if (e.record[filterField] === projectId) {
      loadData()
      if (e.action === 'create' && e.record.autor !== user?.id) {
        // Look up author name from current state or user list
        const authorId = e.record.autor
        pb.collection('users')
          .getOne(authorId)
          .then((author) => {
            toast({
              title: `Novo comentário de ${author.name || 'Usuário'}`,
              description:
                e.record.mensagem.length > 50
                  ? e.record.mensagem.substring(0, 50) + '...'
                  : e.record.mensagem,
            })
          })
          .catch(console.error)
      }
    }
  })

  const handleEdit = (comment: any) => {
    setEditingId(comment.id)
    setEditContent(comment.mensagem)
  }

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    try {
      await pb.collection('comentarios_projeto').update(editingId, { mensagem: editContent.trim() })
      setEditingId(null)
      setEditContent('')
      toast({ title: 'Comentário atualizado' })
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await pb.collection('comentarios_projeto').delete(deletingId)
      toast({ title: 'Comentário removido' })
    } catch (error: any) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return users
    return users.filter((u) => (u.name || '').toLowerCase().includes(mentionQuery.toLowerCase()))
  }, [users, mentionQuery])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    const cursorPos = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@([\w\u00C0-\u017F]*)$/)

    if (match) {
      setShowMentions(true)
      setMentionQuery(match[1])
      setMentionIndex(textBeforeCursor.lastIndexOf('@'))
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (userName: string) => {
    if (mentionIndex === -1) return
    const beforeMention = content.slice(0, mentionIndex)
    const afterMention = content.slice(textareaRef.current?.selectionStart || content.length)

    const newContent = `${beforeMention}@${userName} ${afterMention}`
    setContent(newContent)
    setShowMentions(false)
    setMentionIndex(-1)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = beforeMention.length + userName.length + 2
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || !user) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append(filterField, projectId)
      formData.append('autor', user.id)
      formData.append('mensagem', content.trim())

      attachments.forEach((file) => {
        formData.append('anexos', file)
      })

      await pb.collection('comentarios_projeto').create(formData)

      setContent('')
      setAttachments([])
      setShowMentions(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar o comentário.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderContentWithMentions = (text: string) => {
    if (!text) return null
    const sortedUsers = [...users]
      .filter((u) => u.name)
      .sort((a, b) => b.name.length - a.name.length)
    if (sortedUsers.length === 0) return <span>{text}</span>

    const mentionRegex = new RegExp(
      `(@(?:${sortedUsers.map((u) => u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`,
      'g',
    )
    const parts = text.split(mentionRegex)

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  const getAvatarUrl = (u: any) => (u && u.avatar ? pb.files.getUrl(u, u.avatar) : '')
  const getAnexoUrl = (c: any, filename: string) => pb.files.getUrl(c, filename)

  return (
    <Card className="flex flex-col h-[600px] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-zinc-950 w-full rounded-xl overflow-hidden">
      <CardHeader className="py-4 border-b bg-slate-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          Discussão
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 transition-colors ml-1"
          >
            {comments.length}
          </Badge>
        </CardTitle>
        {projectType === 'projects' && <ProjectPresence projectId={projectId} />}
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                <div className="bg-slate-100 dark:bg-zinc-900 p-3 rounded-full">
                  <Send className="h-6 w-6 text-slate-400 dark:text-zinc-500" />
                </div>
                <p>Nenhum comentário ainda. Inicie a discussão!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isAuthor = comment.autor === user?.id
                const isAdmin = user?.role === 'Administrador'
                const canEditDelete = isAuthor || isAdmin

                return (
                  <div
                    key={comment.id}
                    className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group"
                  >
                    <Avatar className="h-10 w-10 shrink-0 border border-slate-200 dark:border-zinc-800 mt-1">
                      <AvatarImage src={getAvatarUrl(comment.expand?.autor)} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-medium">
                        {(comment.expand?.autor?.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-800 dark:text-zinc-200">
                            {comment.expand?.autor?.name || 'Usuário Desconhecido'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                            {comment.updated !== comment.created && ' (editado)'}
                          </span>
                        </div>
                        {canEditDelete && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            {isAuthor && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                                onClick={() => handleEdit(comment)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-rose-600"
                              onClick={() => setDeletingId(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingId === comment.id ? (
                        <div className="space-y-2 mt-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] text-sm resize-none bg-white dark:bg-zinc-950 focus-visible:ring-indigo-500/20"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(null)}
                              className="h-7 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {renderContentWithMentions(comment.mensagem)}
                        </div>
                      )}

                      {comment.anexos && comment.anexos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {comment.anexos.map((filename: string, i: number) => (
                            <a
                              key={i}
                              href={getAnexoUrl(comment, filename)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group"
                            >
                              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-md group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                                <FileIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700 dark:text-zinc-300 max-w-[150px] truncate">
                                  {filename}
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 relative backdrop-blur-sm">
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-[calc(100%+8px)] left-4 w-64 bg-background dark:bg-zinc-950 border dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
                Membros da equipe
              </div>
              <ScrollArea className="max-h-48">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left text-sm transition-colors"
                    onClick={() => insertMention(u.name)}
                  >
                    <Avatar className="h-7 w-7 border border-slate-200 dark:border-zinc-700">
                      <AvatarImage src={getAvatarUrl(u)} />
                      <AvatarFallback>
                        {(u.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">{u.name}</span>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full pl-3 pr-1.5 py-1.5 text-xs shadow-sm animate-in zoom-in-95 duration-200"
                >
                  <FileIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="truncate max-w-[150px] font-medium dark:text-zinc-200">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400"
                    onClick={() => removeAttachment(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex flex-col gap-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-all shadow-sm">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              placeholder="Adicione um comentário... (Use @ para mencionar)"
              className="min-h-[80px] max-h-[200px] resize-none border-0 focus-visible:ring-0 shadow-none p-2 bg-transparent text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500 dark:text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <div className="flex items-center justify-between mt-1 px-1">
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 gap-2 h-8 px-3 rounded-md transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-xs font-medium hidden sm:inline">Anexar</span>
              </Button>
              <Button
                size="sm"
                className="gap-2 h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={(!content.trim() && attachments.length === 0) || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <span className="text-xs font-medium hidden sm:inline">Enviar</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
