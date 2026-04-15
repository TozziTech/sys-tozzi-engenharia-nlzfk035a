import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { File, Search, Download, Trash2, FolderOpen, Loader2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [projectFilter, setProjectFilter] = useState('Todos')
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [docs, projs] = await Promise.all([
        pb.collection('documentos_projeto').getFullList({ expand: 'projeto_id', sort: '-created' }),
        pb.collection('projetos_cliente').getFullList({ sort: 'nome_projeto' }),
      ])
      setDocuments(docs)
      setProjects(projs)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('documentos_projeto', loadData)
  useRealtime('projetos_cliente', loadData)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return
    try {
      await pb.collection('documentos_projeto').delete(id)
      toast({ title: 'Documento excluído com sucesso!' })
    } catch (error) {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' })
    }
  }

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = projectFilter === 'Todos' || doc.projeto_id === projectFilter
    return matchesSearch && matchesProject
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie os arquivos de todos os projetos dos clientes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" /> Documentos dos Projetos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documento por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filtrar por projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_projeto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]" title={doc.nome_arquivo}>
                            {doc.nome_arquivo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.expand?.projeto_id?.nome_projeto || 'N/A'}</TableCell>
                      <TableCell>{doc.tipo || '-'}</TableCell>
                      <TableCell>{format(new Date(doc.created), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.arquivo && (
                            <a
                              href={pb.files.getUrl(doc, doc.arquivo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                            >
                              <Button variant="ghost" size="icon" title="Baixar">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(doc.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
