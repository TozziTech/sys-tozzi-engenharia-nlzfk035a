import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Plus, Circle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface ProjectVersion {
  id: string
  version: string
  revision: string
  date: string
  author: string
  description: string
}

const INITIAL_VERSIONS: ProjectVersion[] = [
  {
    id: '3',
    version: 'v1.2.0',
    revision: '03',
    date: '2024-01-10',
    author: 'Pedro Costa',
    description: 'Correção de bugs e melhorias de performance.',
  },
  {
    id: '2',
    version: 'v1.1.0',
    revision: '02',
    date: '2023-11-15',
    author: 'Maria Santos',
    description: 'Ajustes estruturais e inclusão de novos módulos.',
  },
  {
    id: '1',
    version: 'v1.0.0',
    revision: '01',
    date: '2023-10-01',
    author: 'João Silva',
    description: 'Versão inicial do projeto.',
  },
]

export function ProjectVersions({ projectId }: { projectId: string }) {
  const [versions, setVersions] = useState<ProjectVersion[]>(INITIAL_VERSIONS)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    version: '',
    revision: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newVersion: ProjectVersion = {
      id: Math.random().toString(36).substring(2, 9),
      ...formData,
    }
    setVersions([newVersion, ...versions])
    setIsOpen(false)

    toast({
      title: 'Nova versão registrada com sucesso!',
      description: `A versão ${formData.version} foi adicionada ao histórico.`,
    })

    setFormData({
      version: '',
      revision: '',
      date: new Date().toISOString().split('T')[0],
      author: '',
      description: '',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Histórico de Versões</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Versão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Versão do Projeto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    required
                    placeholder="ex: v1.3.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revision">Revisão</Label>
                  <Input
                    id="revision"
                    value={formData.revision}
                    onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                    required
                    placeholder="ex: 04"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição das Alterações</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo Anexo</Label>
                <Input id="file" type="file" />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-muted ml-3 space-y-8 mt-4 pb-4">
          {versions.map((v) => (
            <div key={v.id} className="relative pl-6 group">
              <span className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
              </span>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card hover:bg-muted/50 transition-colors p-4 rounded-lg border shadow-sm">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{v.version}</span>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Rev: {v.revision}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{v.author}</span> em{' '}
                    {v.date.split('-').reverse().join('/')}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-wrap text-foreground/90">
                    {v.description}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 shrink-0 md:mt-0 mt-2">
                  <Download className="h-4 w-4" />
                  <span>Baixar Arquivos</span>
                </Button>
              </div>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="pl-6 text-sm text-muted-foreground italic">
              Nenhuma versão registrada para este projeto.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
