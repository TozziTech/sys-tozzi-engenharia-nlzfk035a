import { useState, useEffect } from 'react'
import { Star, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getMyFavorites,
  toggleFavorite,
  UserDocumentFavorite,
} from '@/services/user_document_favorites'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

export default function FavoriteDocumentsPage() {
  const [favorites, setFavorites] = useState<UserDocumentFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await getMyFavorites()
      setFavorites(data)
    } catch (err) {
      toast({ title: 'Erro ao carregar favoritos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('user_document_favorites', () => loadData(), !!user)

  const handleToggleFav = async (docId: string, favId: string) => {
    try {
      await toggleFavorite(user.id, docId, favId)
      toast({ title: 'Favorito removido' })
    } catch (e) {
      toast({ title: 'Erro ao remover favorito', variant: 'destructive' })
    }
  }

  const handleAccess = async (resourceId: string, resourceTitle: string) => {
    try {
      await pb.collection('audit_logs').create({
        user_id: user.id,
        action: 'Acessou Documento',
        resource: 'document_resources',
        details: { id: resourceId, title: resourceTitle },
      })
    } catch (error) {
      console.error('Audit log failed', error)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <Star className="h-6 w-6 text-primary fill-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Favoritos</h1>
          <p className="text-muted-foreground mt-1">
            Sua área de trabalho com os documentos e links mais acessados em um só lugar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-28 bg-muted/50 rounded-t-lg" />
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center bg-card/50">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Nenhum favorito ainda</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Você ainda não favoritou nenhum documento. Clique na estrela nos documentos para fixar
            seus itens mais acessados aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const resource = fav.expand?.document_id
            if (!resource) return null

            return (
              <Card
                key={fav.id}
                className="flex flex-col hover:shadow-lg transition-all border-border/50 group relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background z-10 rounded-full"
                  onClick={() => handleToggleFav(resource.id, fav.id)}
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </Button>
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2 pr-8">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {resource.category}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg leading-tight" title={resource.title}>
                    {resource.title}
                  </CardTitle>
                  <CardDescription
                    className="line-clamp-3 mt-2 text-sm leading-relaxed"
                    title={resource.description || ''}
                  >
                    {resource.description || 'Sem descrição detalhada disponível.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 border-t bg-muted/20 flex gap-2">
                  <Button variant="default" size="sm" className="flex-1 gap-2" asChild>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleAccess(resource.id, resource.title)}
                    >
                      <ExternalLink className="h-4 w-4" /> Acessar Link
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
