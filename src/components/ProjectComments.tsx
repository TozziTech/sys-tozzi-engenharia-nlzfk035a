import { useState, useRef, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Paperclip,
  Send,
  File as FileIcon,
  X,
  Loader2,
  Pencil,
  Trash2,
  Check,
  MessageSquareReply,
  Download,
} from 'lucide-react'
import { formatDistanceToNow, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DateRange } from 'react-day-picker'
import { SmilePlus, Search, CalendarIcon } from 'lucide-react'
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
import { exportCommentsCSV } from '@/lib/export'
import { exportCommentsPDF } from '@/lib/exportPdf'
import useProjectStore from '@/stores/useProjectStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilePreviewModal, type PreviewFile } from '@/components/FilePreviewModal'
import { ImageMarkupEditor } from '@/components/ImageMarkupEditor'

export function ProjectComments({
  projectId,
  projectType = 'projects',
}: {
  projectId: string
  projectType?: 'projects' | 'projetos_cliente'
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { projects } = useProjectStore()

  const [comments, setComments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [markupFileIndex, setMarkupFileIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const filterField = projectType === 'projects' ? 'projeto_interno_id' : 'projeto_id'
  const project = projects.find((p) => p.id === projectId)
  const projectName = project?.name || 'Projeto'

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

  const fetchTyping = async () => {
    try {
      const records = await pb.collection('project_presence').getFullList({
        filter: `project="${projectId}" && is_typing=true && user!="${user?.id}"`,
        expand: 'user',
      })
      setTypingUsers(records.map((r) => r.expand?.user).filter(Boolean))
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (projectId) {
      loadData()
      fetchTyping()
    }
  }, [projectId])

  useRealtime('comentarios_projeto', (e) => {
    if (e.record[filterField] === projectId) {
      loadData()
      if (e.action === 'create' && e.record.autor !== user?.id) {
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

  useRealtime('project_presence', (e) => {
    if (e.record.project === projectId && e.record.user !== user?.id) {
      if (e.action === 'update' || e.action === 'create') {
        if (e.record.is_typing) {
          setTypingUsers((prev) => {
            if (prev.find((u) => u.id === e.record.user)) return prev
            const u = users.find((usr) => usr.id === e.record.user) || e.record.expand?.user
            return u ? [...prev, u] : prev
          })
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.id !== e.record.user))
        }
      } else if (e.action === 'delete') {
        setTypingUsers((prev) => prev.filter((u) => u.id !== e.record.user))
      }
    }
  })

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return
    try {
      const presenceList = await pb.collection('project_presence').getFullList({
        filter: `user="${user.id}" && project="${projectId}"`,
      })
      if (presenceList.length > 0) {
        await pb
          .collection('project_presence')
          .update(presenceList[0].id, { is_typing: isTyping }, { requestKey: null })
      }
    } catch (err) {
      // ignore
    }
  }

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

  const toggleReaction = async (comment: any, emoji: string) => {
    if (!user) return

    const currentReactions = comment.reactions || {}
    const usersForEmoji = currentReactions[emoji] || []

    let newUsersForEmoji
    if (usersForEmoji.includes(user.id)) {
      newUsersForEmoji = usersForEmoji.filter((id: string) => id !== user.id)
    } else {
      newUsersForEmoji = [...usersForEmoji, user.id]
    }

    const newReactions = { ...currentReactions, [emoji]: newUsersForEmoji }
    if (newUsersForEmoji.length === 0) delete newReactions[emoji]

    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, reactions: newReactions } : c)),
    )

    try {
      await pb.collection('comentarios_projeto').update(comment.id, { reactions: newReactions })
    } catch (error) {
      loadData()
      toast({ title: 'Erro ao registrar reação', variant: 'destructive' })
    }
  }

  const handleReply = (comment: any) => {
    const rootComment = comment.parent_id
      ? comments.find((c) => c.id === comment.parent_id) || comment
      : comment
    setReplyingTo(rootComment)
    textareaRef.current?.focus()
  }

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      let matchesSearch = true
      if (searchQuery) {
        matchesSearch = c.mensagem.toLowerCase().includes(searchQuery.toLowerCase())
      }

      let matchesDate = true
      if (dateRange?.from) {
        const commentDate = new Date(c.created)
        if (dateRange.to) {
          matchesDate = isWithinInterval(commentDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          })
        } else {
          matchesDate = isWithinInterval(commentDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.from),
          })
        }
      }

      let matchesAuthor = true
      if (authorFilter !== 'all') {
        matchesAuthor = c.autor === authorFilter
      }

      return matchesSearch && matchesDate && matchesAuthor
    })
  }, [comments, searchQuery, dateRange, authorFilter])

  const topLevelComments = useMemo(
    () => filteredComments.filter((c) => !c.parent_id),
    [filteredComments],
  )

  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return users
    return users.filter((u) => (u.name || '').toLowerCase().includes(mentionQuery.toLowerCase()))
  }, [users, mentionQuery])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    if (!typingTimeoutRef.current) {
      updateTypingStatus(true)
    } else {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false)
      typingTimeoutRef.current = null
    }, 3000)

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
    const commentContent = content.trim()

    try {
      const formData = new FormData()
      formData.append(filterField, projectId)
      formData.append('autor', user.id)
      formData.append('mensagem', commentContent)

      if (replyingTo) {
        formData.append('parent_id', replyingTo.id)
      }

      attachments.forEach((file) => {
        formData.append('anexos', file)
      })

      await pb.collection('comentarios_projeto').create(formData)

      // Create mention notifications
      try {
        const sortedUsers = [...users]
          .filter((u) => u.name)
          .sort((a, b) => b.name.length - a.name.length)
        if (sortedUsers.length > 0) {
          const mentionRegex = new RegExp(
            `(@(?:${sortedUsers.map((u) => u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`,
            'g',
          )
          const mentions = commentContent.match(mentionRegex)
          if (mentions) {
            const uniqueMentions = [...new Set(mentions)]
            for (const mention of uniqueMentions) {
              const name = mention.substring(1)
              const mentionedUser = users.find((u) => u.name === name)
              if (mentionedUser && mentionedUser.id !== user.id) {
                await pb.collection('notifications').create({
                  user: mentionedUser.id,
                  title: `Menção em Comentário`,
                  message: `${user.name} mencionou você no projeto ${projectName}.`,
                  link: `/projects/${projectId}`,
                  action_type: 'mention',
                  read: false,
                })
              }
            }
          }
        }
      } catch (notifErr) {
        console.error('Erro ao notificar menções:', notifErr)
      }

      setContent('')
      setAttachments([])
      setShowMentions(false)
      setReplyingTo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      updateTypingStatus(false)
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

  const handleExportCSV = () => exportCommentsCSV(comments, projectName)
  const handleExportPDF = () => exportCommentsPDF(comments, projectName, user?.name || 'Usuário')

  const isCommentLocked = (comment: any) => {
    const hasAttachments = comment.anexos && comment.anexos.length > 0
    if (!hasAttachments) return false

    const isConcluido =
      project?.status === 'Concluído' || (project as any)?.status_geral === 'Concluído'
    const isOlderThan24h =
      new Date().getTime() - new Date(comment.created).getTime() > 24 * 60 * 60 * 1000

    return isConcluido || isOlderThan24h
  }

  const CommentItem = ({ comment, isReply = false }: { comment: any; isReply?: boolean }) => {
    const isAuthor = comment.autor === user?.id
    const isAdmin = user?.role === 'Administrador'
    const canEditDelete = isAuthor || isAdmin

    return (
      <div
        className={cn(
          'flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group',
          isReply && 'mt-4',
        )}
      >
        <Avatar
          className={cn(
            'shrink-0 border border-slate-200 dark:border-zinc-800 mt-1',
            isReply ? 'h-8 w-8' : 'h-10 w-10',
          )}
        >
          <AvatarImage src={getAvatarUrl(comment.expand?.autor)} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-medium">
            {(comment.expand?.autor?.name || 'U').substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 overflow-hidden">
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
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                onClick={() => handleReply(comment)}
                title="Responder"
              >
                <MessageSquareReply className="h-3.5 w-3.5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-1 flex gap-1 shadow-lg" side="top">
                  {['👍', '❤️', '🚀', '✅', '💡'].map((emoji) => {
                    const hasReacted = comment.reactions?.[emoji]?.includes(user?.id)
                    return (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 text-lg',
                          hasReacted
                            ? 'bg-slate-100 dark:bg-zinc-800'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800',
                        )}
                        onClick={() => toggleReaction(comment, emoji)}
                      >
                        {emoji}
                      </Button>
                    )
                  })}
                </PopoverContent>
              </Popover>

              {canEditDelete && (
                <>
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
                  {!isCommentLocked(comment) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-rose-600"
                      onClick={() => setDeletingId(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 inline-flex items-center justify-center text-slate-300 cursor-not-allowed">
                            <Trash2 className="h-3.5 w-3.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bloqueado: Projeto concluído ou comentário &gt; 24h com anexos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              )}
            </div>
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
            <div className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
              {renderContentWithMentions(comment.mensagem)}
            </div>
          )}

          {comment.anexos && comment.anexos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {comment.anexos.map((filename: string, i: number) => {
                const url = getAnexoUrl(comment, filename)
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
                const isPdf = filename.toLowerCase().endsWith('.pdf')

                if (isImage) {
                  return (
                    <div
                      key={i}
                      className="relative group cursor-pointer border border-slate-200 dark:border-zinc-800 rounded-md overflow-hidden h-16 w-24 bg-slate-100 dark:bg-zinc-900 shadow-sm shrink-0"
                      onClick={() => setPreviewFile({ url, name: filename, type: 'image' })}
                    >
                      <img
                        src={url}
                        alt={filename}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )
                }

                return (
                  <button
                    key={i}
                    onClick={() =>
                      isPdf
                        ? setPreviewFile({ url, name: filename, type: 'pdf' })
                        : window.open(url, '_blank')
                    }
                    className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group text-left max-w-[200px]"
                  >
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-md group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors shrink-0">
                      <FileIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">
                      {filename}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {comment.reactions && Object.keys(comment.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <TooltipProvider delayDuration={300}>
                {Object.entries(comment.reactions).map(([emoji, userIds]: [string, any]) => {
                  if (!userIds || userIds.length === 0) return null
                  const hasReacted = user?.id && userIds.includes(user.id)
                  const reactorNames = userIds
                    .map((id: string) => users.find((u) => u.id === id)?.name || 'Usuário')
                    .join(', ')

                  return (
                    <Tooltip key={emoji}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleReaction(comment, emoji)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors border',
                            hasReacted
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800',
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{reactorNames}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-[600px] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-zinc-950 w-full rounded-xl overflow-hidden relative">
      <CardHeader className="py-4 border-b bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between w-full gap-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            Discussão
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 transition-colors ml-1"
            >
              {comments.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  disabled={comments.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={handleExportCSV}
                >
                  Exportar para CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={handleExportPDF}
                >
                  Exportar para PDF
                </Button>
              </PopoverContent>
            </Popover>
            {projectType === 'projects' && <ProjectPresence projectId={projectId} />}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nas discussões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm bg-white dark:bg-zinc-950"
            />
          </div>

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[150px] bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Autor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Autores</SelectItem>
              {Array.from(new Set(comments.map((c) => c.autor))).map((authorId) => {
                const u = users.find((usr) => usr.id === authorId)
                if (!u) return null
                return (
                  <SelectItem key={authorId} value={authorId}>
                    {u.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 justify-start text-left font-normal w-full sm:w-[240px] bg-white dark:bg-zinc-950',
                  !dateRange?.from && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yy')
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={ptBR}
              />
              {dateRange?.from && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => setDateRange(undefined)}
                  >
                    Limpar Filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
        <ScrollArea className="flex-1 p-4 md:p-6 pb-12">
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
            ) : filteredComments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                <div className="bg-slate-100 dark:bg-zinc-900 p-3 rounded-full">
                  <Search className="h-6 w-6 text-slate-400 dark:text-zinc-500" />
                </div>
                <p>Nenhum comentário encontrado para os filtros aplicados.</p>
              </div>
            ) : (
              topLevelComments.map((comment) => {
                const replies = filteredComments.filter((c) => c.parent_id === comment.id)
                return (
                  <div key={comment.id}>
                    <CommentItem comment={comment} />
                    {replies.length > 0 && (
                      <div className="pl-12 space-y-4 border-l-2 border-slate-100 dark:border-zinc-800 ml-5 mt-4">
                        {replies.map((reply) => (
                          <CommentItem key={reply.id} comment={reply} isReply />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 relative backdrop-blur-sm z-10">
          {typingUsers.length > 0 && (
            <div className="absolute -top-7 left-4 text-xs text-muted-foreground flex items-center gap-1.5 animate-in fade-in duration-200 z-0 px-2 py-1 bg-white/80 dark:bg-zinc-900/80 rounded-t-md backdrop-blur-sm">
              <div className="flex gap-0.5 mt-0.5">
                <span
                  className="w-1 h-1 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} está digitando...`
                : `${typingUsers.length} pessoas estão digitando...`}
            </div>
          )}

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
              {attachments.map((file, i) => {
                const isImage = file.type.startsWith('image/')
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-full pl-3 pr-1.5 py-1.5 text-xs shadow-sm animate-in zoom-in-95 duration-200"
                  >
                    <FileIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span className="truncate max-w-[150px] font-medium dark:text-zinc-200">
                      {file.name}
                    </span>
                    {isImage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-700"
                        onClick={() => setMarkupFileIndex(i)}
                        title="Editar Imagem"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400"
                      onClick={() => removeAttachment(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <div
            className={cn(
              'relative flex flex-col gap-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-all shadow-sm',
              replyingTo ? 'rounded-b-xl rounded-t-md' : 'rounded-xl',
            )}
          >
            {replyingTo && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 rounded-t-md">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquareReply className="h-3.5 w-3.5" />
                  <span>
                    Respondendo a{' '}
                    <span className="font-semibold text-foreground">
                      {replyingTo.expand?.autor?.name || 'Usuário'}
                    </span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="p-2 flex flex-col gap-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                placeholder={
                  replyingTo
                    ? 'Escreva sua resposta...'
                    : 'Adicione um comentário... (Use @ para mencionar)'
                }
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

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {markupFileIndex !== null && attachments[markupFileIndex] && (
        <ImageMarkupEditor
          file={attachments[markupFileIndex]}
          open={true}
          onClose={() => setMarkupFileIndex(null)}
          onSave={(editedFile) => {
            setAttachments((prev) => prev.map((f, i) => (i === markupFileIndex ? editedFile : f)))
            setMarkupFileIndex(null)
          }}
        />
      )}
    </Card>
  )
}
