import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  getContactInteractions,
  createContactInteraction,
  deleteContactInteraction,
  type ContactInteraction,
} from '@/services/contact_interactions'
import { useRealtime } from '@/hooks/use-realtime'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2 } from 'lucide-react'

export function ContactHistoryTab({ contactId }: { contactId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [interactions, setInteractions] = useState<ContactInteraction[]>([])
  const [newContent, setNewContent] = useState('')
  const [loading, setLoading] = useState(false)

  const loadInteractions = async () => {
    try {
      const data = await getContactInteractions(contactId)
      setInteractions(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadInteractions()
  }, [contactId])

  useRealtime('contact_interactions', (e) => {
    if (e.record.contact === contactId || e.action === 'delete') {
      loadInteractions()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim() || !user) return

    setLoading(true)
    try {
      await createContactInteraction({
        contact: contactId,
        user: user.id,
        content: newContent.trim(),
        interaction_date: new Date().toISOString(),
      })
      setNewContent('')
      toast({ title: 'Sucesso', description: 'Interação registrada.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a interação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContactInteraction(id)
      toast({ title: 'Sucesso', description: 'Interação excluída.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a interação.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Registre uma nova interação, ligação ou nota..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!newContent.trim() || loading}>
            {loading ? 'Salvando...' : 'Salvar Histórico'}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Histórico Recente</h4>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma interação registrada.
          </p>
        ) : (
          interactions.map((interaction) => (
            <div key={interaction.id} className="flex gap-4 p-4 rounded-lg border bg-card/50">
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarImage
                  src={
                    interaction.expand?.user?.avatar
                      ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${interaction.user}/${interaction.expand.user.avatar}`
                      : ''
                  }
                />
                <AvatarFallback>{interaction.expand?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {interaction.expand?.user?.name || 'Usuário Desconhecido'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(interaction.interaction_date || interaction.created),
                        "dd 'de' MMM, yyyy 'às' HH:mm",
                        { locale: ptBR },
                      )}
                    </span>
                    {user?.id === interaction.user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(interaction.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">
                  {interaction.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
