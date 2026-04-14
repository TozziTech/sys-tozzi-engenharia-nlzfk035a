import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  ExternalLink,
  Edit,
  Trash,
  BookOpen,
  FileCheck,
  FileStack,
  FileSpreadsheet,
  GraduationCap,
  LinkIcon,
  ShieldAlert,
  Star,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getDocumentResources,
  deleteDocumentResource,
  DocumentResource,
} from '@/services/document_resources'
import {
  getMyFavorites,
  toggleFavorite,
  UserDocumentFavorite,
} from '@/services/user_document_favorites'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { DocumentResourceDialog } from '@/components/files/DocumentResourceDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function DocumentResourcesPage({
  category,
  title,
}: {
  category: string
  title: string
}) {
  const [resources, setResources] = useState<DocumentResource[]>([])
  const [favorites, setFavorites] = useState<UserDocumentFavorite[]>([])
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === 'Administrador'
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<DocumentResource | null>(null)

  const allowedRolesForCategory: Record<string, string[]> = {
    POPs: ['Administrador', 'Gerente de Projeto', 'Projetista'],
    'Projetos Base': ['Administrador', 'Gerente de Projeto', 'Projetista'],
    'Documentos Modelos': ['Administrador', 'Gerente de Projeto', 'Projetista', 'Estagiário'],
  }

  const allowedRoles = allowedRolesForCategory[category]
  const hasAccess = !allowedRoles || (user?.role && allowedRoles.includes(user.role))

  const loadData = async () => {
    if (!hasAccess) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await getDocumentResources(category)
      setResources(data)
    } catch (err) {
      toast({ title: 'Erro ao carregar documentos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async () => {
    if (!user) return
    try {
      const data = await getMyFavorites()
      setFavorites(data)
    } catch (err) {
      console.error('Failed to load favorites', err)
    }
  }

  useEffect(() => {
    loadData()
    loadFavorites()
  }, [category, hasAccess, user])

  useRealtime('document_resources', () => loadData(), hasAccess)
  useRealtime('user_document_favorites', () => loadFavorites(), hasAccess && !!user)

  const handleDelete = async (id: string) => {
    try {
      await deleteDocumentResource(id)
      toast({ title: 'Documento excluído com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' })
    }
  }

  const handleToggleFav = async (docId: string, favId?: string) => {
    try {
      await toggleFavorite(user.id, docId, favId)
      toast({ title: favId ? 'Favorito removido' : 'Favorito adicionado' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar favorito', variant: 'destructive' })
    }
  }

  const handleAccessLink = async (resource: DocumentResource) => {
    try {
      await pb.collection('audit_logs').create({
        user_id: user.id,
        action: 'Acessou Documento',
        resource: 'document_resources',
        details: { id: resource.id, title: resource.title },
      })
    } catch (error) {
      console.error('Audit log failed', error)
    }
  }

  const getIcon = (className = 'h-6 w-6 text-primary') => {
    switch (category) {
      case 'Biblioteca':
        return <BookOpen className={className} />
      case 'POPs':
        return <FileCheck className={className} />
      case 'Projetos Base':
        return <FileStack className={className} />
      case 'Documentos Modelos':
        return <FileSpreadsheet className={className} />
      case 'Cursos':
        return <GraduationCap className={className} />
      default:
        return <LinkIcon className={className} />
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="rounded-full bg-destructive/10 p-6 mb-2">
          <ShieldAlert className="h-14 w-14 text-destructive" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Acesso Negado</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          Você não tem permissão para acessar a categoria "{category}". Entre em contato com um
          administrador se precisar de acesso.
        </p>
      </div>
    )
  }

  const displayedResources = showOnlyFavorites
    ? resources.filter((r) => favorites.some((f) => f.document_id === r.id))
    : resources

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">{getIcon()}</div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-1">
              Acesse e gerencie referências externas e documentos padrão.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 mr-2">
            <Switch
              id="favorite-mode"
              checked={showOnlyFavorites}
              onCheckedChange={setShowOnlyFavorites}
            />
            <Label htmlFor="favorite-mode" className="cursor-pointer">
              Mostrar apenas favoritos
            </Label>
          </div>
          <Button variant="outline" asChild>
            <Link to="/files/favorites">
              <Star className="mr-2 h-4 w-4" /> Meus Favoritos
            </Link>
          </Button>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingResource(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Link
            </Button>
          )}
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
      ) : displayedResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center bg-card/50">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            {getIcon('h-8 w-8 text-primary')}
          </div>
          <h3 className="text-xl font-semibold">Nenhum documento encontrado</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            {showOnlyFavorites
              ? 'Você não favoritou nenhum documento nesta categoria ainda.'
              : `Não há documentos na categoria "${category}" no momento.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedResources.map((resource) => {
            const isFav = favorites.find((f) => f.document_id === resource.id)

            return (
              <Card
                key={resource.id}
                className="flex flex-col hover:shadow-lg transition-all border-border/50 group relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background z-10 rounded-full"
                  onClick={() => handleToggleFav(resource.id, isFav?.id)}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
                    )}
                  />
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
                      onClick={() => handleAccessLink(resource)}
                    >
                      <ExternalLink className="h-4 w-4" /> Acessar Link
                    </a>
                  </Button>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-background"
                        onClick={() => {
                          setEditingResource(resource)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o documento "{resource.title}"? Esta
                              ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(resource.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <DocumentResourceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        resource={editingResource}
        category={category}
        onSuccess={loadData}
      />
    </div>
  )
}
