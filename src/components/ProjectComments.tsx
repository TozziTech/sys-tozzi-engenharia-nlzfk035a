import { useState, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Paperclip, Send, File, X } from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { ptBR } from 'date-fns/locale'

export function ProjectComments({ projectId }: { projectId: string }) {
  const { comments, users, addComment } = useProjectStore()

  const [content, setContent] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const projectComments = useMemo(
    () =>
      comments
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [comments, projectId],
  )

  useRealtime('project_comments', () => {
    // Updates UI when a new comment is added from backend via real-time subscription
  })

  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return users
    return users.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
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

  const handleAddAttachment = () => {
    const mockFiles = [
      { name: 'Planta_Baixa_v2.pdf', size: '2.4 MB' },
      { name: 'Foto_Terreno.jpg', size: '4.1 MB' },
      { name: 'Relatorio_Sondagem.docx', size: '1.2 MB' },
    ]
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)]
    setAttachments((prev) => [...prev, randomFile])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      author: users[0],
      content: content.trim(),
      timestamp: new Date().toISOString(),
      attachments: attachments.map((a, i) => ({
        id: `att-${i}`,
        name: a.name,
        url: '#',
        size: a.size,
      })),
    }

    addComment(newComment)
    setContent('')
    setAttachments([])
    setShowMentions(false)
  }

  const renderContentWithMentions = (text: string) => {
    if (!text) return null
    const sortedUsers = [...users].sort((a, b) => b.name.length - a.name.length)
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

  return (
    <Card className="flex flex-col h-[600px] border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="py-4 border-b bg-slate-50/50 dark:bg-slate-900/20">
        <CardTitle className="text-lg flex items-center gap-2">
          Discussão do Projeto
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors ml-2"
          >
            {projectComments.length} {projectComments.length === 1 ? 'comentário' : 'comentários'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6">
            {projectComments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                  <Send className="h-6 w-6 text-slate-400" />
                </div>
                <p>Nenhum comentário ainda. Inicie a discussão!</p>
              </div>
            ) : (
              projectComments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <Avatar className="h-10 w-10 shrink-0 border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                      {comment.author.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {renderContentWithMentions(comment.content)}
                    </div>

                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {comment.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs hover:border-indigo-300 transition-colors cursor-pointer group"
                          >
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-md group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                              <File className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{att.size}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-slate-50/80 dark:bg-slate-900/80 relative backdrop-blur-sm">
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-[calc(100%+8px)] left-4 w-64 bg-background border rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900 border-b">
                Membros da equipe
              </div>
              <ScrollArea className="max-h-48">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm transition-colors"
                    onClick={() => insertMention(user.name)}
                  >
                    <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                      <AvatarImage src={user.avatar} />
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
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
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border rounded-full pl-3 pr-1.5 py-1.5 text-xs shadow-sm animate-in zoom-in-95 duration-200"
                >
                  <File className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="truncate max-w-[150px] font-medium">{file.name}</span>
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

          <div className="relative flex flex-col gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              placeholder="Adicione um comentário... (Use @ para mencionar)"
              className="min-h-[80px] max-h-[200px] resize-none border-0 focus-visible:ring-0 shadow-none p-2 bg-transparent text-sm placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <div className="flex items-center justify-between mt-1 px-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 gap-2 h-8 px-3 rounded-md transition-colors"
                onClick={handleAddAttachment}
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-xs font-medium hidden sm:inline">Anexar</span>
              </Button>
              <Button
                size="sm"
                className="gap-2 h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform active:scale-95"
                onClick={handleSubmit}
                disabled={!content.trim() && attachments.length === 0}
              >
                <span className="text-xs font-medium hidden sm:inline">Enviar</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
