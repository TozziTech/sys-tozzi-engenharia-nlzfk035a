import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { FileText, Plus, Search, ExternalLink, Trash2, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function DocumentResourcesPage({
  category,
  title,
}: {
  category: string
  title: string
}) {
  const [documents, setDocuments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
  })

  const loadData = async () => {
    try {
      const records = await pb.collection('document_resources').getFullList({
        filter: `category = "${category}"`,
        sort: 'ordem,-created',
      })
      setDocuments(records)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [category])

  useRealtime('document_resources', () => loadData())

  const filteredDocs = useMemo(() => {
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [documents, search])

  const handleSave = async () => {
    try {
      if (editingDoc) {
        await pb.collection('document_resources').update(editingDoc.id, formData)
        toast({ title: 'Sucesso', description: 'Documento atualizado.' })
      } else {
        await pb.collection('document_resources').create({
          ...formData,
          category,
        })
        toast({ title: 'Sucesso', description: 'Documento criado.' })
      }
      setIsModalOpen(false)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar documento.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir?')) return
    try {
      await pb.collection('document_resources').delete(id)
      toast({ title: 'Sucesso', description: 'Documento excluído.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const openModal = (doc?: any) => {
    if (doc) {
      setEditingDoc(doc)
      setFormData({ title: doc.title, description: doc.description || '', url: doc.url })
    } else {
      setEditingDoc(null)
      setFormData({ title: '', description: '', url: '' })
    }
    setIsModalOpen(true)
  }

  const moduleKeyMap: Record<string, string> = {
    Biblioteca: 'biblioteca',
    POPs: 'pops',
    'Projetos Base': 'projetos_base',
    'Documentos Modelos': 'documentos_modelos',
    Cursos: 'cursos',
  }

  const moduleId = moduleKeyMap[category] || 'biblioteca'

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
            <FileText className="h-8 w-8" /> {title}
          </h1>
          <p className="text-muted-foreground">Gerencie os recursos de {title.toLowerCase()}.</p>
        </div>

        <PermissionGuard module={moduleId} action="write">
          <Button
            onClick={() => openModal()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </PermissionGuard>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-card border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-2" title={doc.title}>
                {doc.title}
              </h3>
              <div className="flex items-center gap-1">
                <PermissionGuard module={moduleId} action="write">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500"
                    onClick={() => openModal(doc)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
              {doc.description}
            </p>
            <div className="mt-auto">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center text-sm font-medium text-amber-600 hover:text-amber-500"
              >
                Acessar Recurso <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl border-dashed">
            Nenhum recurso encontrado.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Editar Recurso' : 'Novo Recurso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
