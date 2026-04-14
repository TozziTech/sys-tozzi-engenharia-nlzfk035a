import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getDocumentResources,
  deleteDocumentResource,
  DocumentResource,
} from '@/services/document_resources'
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

export default function DocumentResourcesPage({
  category,
  title,
}: {
  category: string
  title: string
}) {
  const [resources, setResources] = useState<DocumentResource[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === 'Administrador'
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<DocumentResource | null>(null)

  const loadData = async () => {
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

  useEffect(() => {
    loadData()
  }, [category])

  useRealtime('document_resources', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteDocumentResource(id)
      toast({ title: 'Documento excluído com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' })
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

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-28 bg-muted/50 rounded-t-lg" />
            </Card>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center bg-card/50">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            {getIcon('h-8 w-8 text-primary')}
          </div>
          <h3 className="text-xl font-semibold">Nenhum documento encontrado</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Não há documentos na categoria "{category}" no momento.
            {isAdmin && " Clique em 'Adicionar Link' para começar."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="flex flex-col hover:shadow-lg transition-all border-border/50 group"
            >
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="secondary" className="font-normal text-xs">
                    {category}
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
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
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
                            Tem certeza que deseja remover o documento "{resource.title}"? Esta ação
                            não pode ser desfeita.
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
          ))}
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
