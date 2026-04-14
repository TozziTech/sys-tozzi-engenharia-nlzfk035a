import { useState, useEffect, ReactNode } from 'react'
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
  Search,
  Copy,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { cn, getContrastYIQ } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function ManageTagsDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center text-muted-foreground">
          Funcionalidade de gerenciamento de tags em desenvolvimento.
        </div>
      </DialogContent>
    </Dialog>
  )
}

const DISCIPLINES = [
  { id: 'favorites', label: '⭐ Favoritos' },
  { id: 'all', label: 'Todas as Disciplinas' },
  { id: 'Concreto Armado', label: 'Concreto Armado' },
  { id: 'Metálico', label: 'Metálico' },
  { id: 'Hidrossanitário', label: 'Hidrossanitário' },
  { id: 'Elétrico', label: 'Elétrico' },
  { id: 'Prevenção de Incêndio', label: 'Prevenção de Incêndio' },
  { id: 'Gases', label: 'Gases' },
  { id: 'Constr. Civil', label: 'Constr. Civil' },
  { id: 'Patologia', label: 'Patologia' },
  { id: 'Outros', label: 'Outros' },
]

export default function DocumentResourcesPage({
  category,
  title,
}: {
  category: string
  title: string
}) {
  const [resources, setResources] = useState<DocumentResource[]>([])
  const [favorites, setFavorites] = useState<UserDocumentFavorite[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_desc')
  const [availableTags, setAvailableTags] = useState<any[]>([])
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
    pb.collection('tags').getFullList({ sort: 'name' }).then(setAvailableTags).catch(console.error)
  }, [category, hasAccess, user])

  useRealtime('document_resources', () => loadData(), hasAccess)
  useRealtime('user_document_favorites', () => loadFavorites(), hasAccess && !!user)
  useRealtime(
    'tags',
    () => {
      pb.collection('tags')
        .getFullList({ sort: 'name' })
        .then(setAvailableTags)
        .catch(console.error)
    },
    hasAccess,
  )

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

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro ao copiar link', variant: 'destructive' })
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

  const displayedResources = resources
    .filter((r) => {
      const searchLower = searchQuery.toLowerCase()
      const matchSearch =
        searchLower === '' ||
        r.title.toLowerCase().includes(searchLower) ||
        (r.description?.toLowerCase().includes(searchLower) ?? false)

      const isFav = favorites.some((f) => f.document_id === r.id)
      const matchFav = selectedDiscipline === 'favorites' ? isFav : true

      const matchTag = selectedTag === 'all' ? true : r.tags?.includes(selectedTag)

      const isSearchActive = searchLower !== ''
      const matchDiscipline =
        selectedDiscipline === 'all' || selectedDiscipline === 'favorites' || isSearchActive
          ? true
          : r.discipline === selectedDiscipline

      return matchSearch && matchFav && matchTag && matchDiscipline
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title)
      } else if (sortBy === 'updated_desc') {
        return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime()
      } else {
        return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()
      }
    })

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
          <div className="relative w-full sm:w-64 lg:w-80 mr-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar documentos..."
              className="w-full pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Tags</SelectItem>
              {availableTags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Mais Recentes</SelectItem>
              <SelectItem value="title_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="updated_desc">Última Modificação</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to="/files/favorites">
              <Star className="mr-2 h-4 w-4" /> Meus Favoritos
            </Link>
          </Button>
          {isAdmin && (
            <>
              <ManageTagsDialog>
                <Button variant="outline">Gerenciar Tags</Button>
              </ManageTagsDialog>
              <Button
                onClick={() => {
                  setEditingResource(null)
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Link
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={selectedDiscipline} onValueChange={setSelectedDiscipline} className="w-full">
        <ScrollArea className="max-w-full pb-2">
          <TabsList className="inline-flex w-max min-w-full justify-start h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
            {DISCIPLINES.map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="whitespace-nowrap">
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Tabs>

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
            {selectedDiscipline === 'favorites'
              ? 'Você ainda não possui documentos favoritos.'
              : searchQuery
                ? 'Nenhum documento encontrado para a sua busca.'
                : selectedDiscipline !== 'all'
                  ? 'Nenhum documento encontrado para esta disciplina.'
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
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {resource.category}
                      </Badge>
                      {resource.discipline && (
                        <Badge
                          variant="outline"
                          className="font-normal text-xs text-primary border-primary/20 bg-primary/5"
                        >
                          {resource.discipline}
                        </Badge>
                      )}
                      {resource.expand?.tags?.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          className="font-normal text-xs border-none"
                          style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-background shrink-0"
                    onClick={() => handleCopyLink(resource.url)}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
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
        prefillDiscipline={
          ['all', 'favorites'].includes(selectedDiscipline) ? '' : selectedDiscipline
        }
      />
    </div>
  )
}
