import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createComment } from '@/services/client_dashboard'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, User } from 'lucide-react'

export function ClientComments({ projectId, comments }: { projectId: string; comments: any[] }) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return
    setIsSubmitting(true)
    try {
      await createComment(projectId, newComment.trim(), user.id)
      setNewComment('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum comentário ainda. Inicie a conversa!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-sm animate-fade-in-up">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.expand?.autor?.avatar} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {comment.expand?.autor?.name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {comment.mensagem}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-auto pt-4 border-t">
        <Textarea
          placeholder="Digite seu comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <Button
          size="icon"
          className="shrink-0 h-auto"
          disabled={!newComment.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
