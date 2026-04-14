import { useState, useEffect } from 'react'
import { Star, ExternalLink, LayoutGrid, List, Copy } from 'lucide-react'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export default function FavoriteDocumentsPage() {
  const [favorites, setFavorites] = useState<UserDocumentFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('document-view-mode') as 'grid' | 'list') || 'grid'
  })
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

  useEffect(() => {
    localStorage.setItem('document-view-mode', viewMode)
  }, [viewMode])

  useRealtime('user_document_favorites', () => loadData(), !!user)

  const handleToggleFav = async (docId: string, favId: string) => {
    try {
      await toggleFavorite(user.id, docId, favId)
      toast({ title: 'Favorito removido' })
    } catch (e) {
      toast({ title: 'Erro ao remover favorito', variant: 'destructive' })
    }
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao copiar link', variant: 'destructive' })
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
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
        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}
            className="bg-background border rounded-md h-10 p-1"
          >
            <ToggleGroupItem value="grid" aria-label="Grid View" className="h-8 px-2">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List View" className="h-8 px-2">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
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
      ) : viewMode === 'list' ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Título</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Favoritado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {favorites.map((fav) => {
                const resource = fav.expand?.document_id
                if (!resource) return null

                return (
                  <TableRow key={fav.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full shrink-0 -mt-1"
                          onClick={() => handleToggleFav(resource.id, fav.id)}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-medium text-base truncate" title={resource.title}>
                            {resource.title}
                          </span>
                          <span
                            className="text-sm text-muted-foreground line-clamp-1"
                            title={resource.description || ''}
                          >
                            {resource.description || 'Sem descrição'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="font-normal text-xs whitespace-nowrap">
                        {resource.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(fav.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="icon"
                          className="h-9 w-9"
                          asChild
                          title="Acessar Link"
                        >
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleAccess(resource.id, resource.title)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-background shrink-0"
                          onClick={() => handleCopyLink(resource.url)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-background shrink-0"
                    onClick={() => handleCopyLink(resource.url)}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
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
