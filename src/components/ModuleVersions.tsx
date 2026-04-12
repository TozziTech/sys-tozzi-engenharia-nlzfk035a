import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Download, Plus, Circle, Loader2, FileArchive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface ProjectVersion {
  id: string
  version_label: string
  description: string
  file: string
  created: string
}

export function ModuleVersions({ moduleId }: { moduleId: string }) {
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    version_label: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  const loadVersions = async () => {
    try {
      const records = await pb.collection('project_versions').getFullList<ProjectVersion>({
        filter: `module = "${moduleId}"`,
        sort: '-created',
      })
      setVersions(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (moduleId) {
      loadVersions()
    }
  }, [moduleId])

  useRealtime('project_versions', loadVersions)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.version_label.trim()) {
      toast({
        title: 'Rótulo obrigatório',
        description: 'Por favor, insira o rótulo da versão (ex: R01).',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const data = new FormData()
      data.append('module', moduleId)
      data.append('version_label', formData.version_label)
      if (formData.description) data.append('description', formData.description)
      data.append('file', file)

      await pb.collection('project_versions').create(data)

      toast({
        title: 'Versão registrada!',
        description: `A versão ${formData.version_label} foi adicionada com sucesso.`,
      })

      setIsOpen(false)
      setFormData({
        version_label: '',
        description: '',
      })
      setFile(null)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao enviar para o servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">Versões da Disciplina</CardTitle>
          <CardDescription>Gerencie o histórico de revisões e entregas</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Versão</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Versão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="version_label">Rótulo da Versão (ex: R01, Final)</Label>
                <Input
                  id="version_label"
                  value={formData.version_label}
                  onChange={(e) => setFormData({ ...formData, version_label: e.target.value })}
                  required
                  placeholder="R01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Change Log</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="O que mudou nesta versão?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo Anexo</Label>
                <Input
                  id="file"
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8 text-muted-foreground">Carregando versões...</div>
        ) : versions.length > 0 ? (
          <div className="relative border-l-2 border-muted ml-3 space-y-6 mt-2 pb-4">
            {versions.map((v) => (
              <div key={v.id} className="relative pl-6 group">
                <span className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                </span>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card hover:bg-muted/50 transition-colors p-4 rounded-lg border shadow-sm">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{v.version_label}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(new Date(v.created), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    {v.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap text-foreground/90">
                        {v.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                      onClick={() => {
                        if (v.file) {
                          const url = pb.files.getURL(v, v.file)
                          window.open(url, '_blank')
                        }
                      }}
                      disabled={!v.file}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Baixar</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md bg-muted/10 flex flex-col items-center">
            <FileArchive className="h-8 w-8 mb-2 opacity-50" />
            <p>Nenhuma versão registrada para esta disciplina.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
