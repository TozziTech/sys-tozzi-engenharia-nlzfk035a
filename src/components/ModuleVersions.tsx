import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export function ModuleVersions({ moduleId }: { moduleId: string }) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    version_label: '',
    revision: '',
    description: '',
    status: 'Pendente',
    is_critical: false,
    file: null as File | null,
  })

  const loadVersions = useCallback(async () => {
    try {
      const records = await pb.collection('project_versions').getFullList({
        filter: `module = "${moduleId}"`,
        sort: '-created',
        expand: 'approved_by',
      })
      setVersions(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  useRealtime('project_versions', loadVersions)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.version_label.trim()) {
      toast({
        title: 'Atenção',
        description: 'O campo Versão é obrigatório',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const data = new FormData()
      data.append('module', moduleId)
      data.append('version_label', formData.version_label.trim())
      if (formData.revision) data.append('revision', formData.revision.trim())
      if (formData.description) data.append('description', formData.description.trim())
      data.append('status', formData.status)
      data.append('is_critical', formData.is_critical.toString())

      if (formData.file) {
        data.append('file', formData.file)
      }

      await pb.collection('project_versions').create(data)

      toast({ title: 'Sucesso', description: 'Nova versão registrada com sucesso.' })
      setOpen(false)
      setFormData({
        version_label: '',
        revision: '',
        description: '',
        status: 'Pendente',
        is_critical: false,
        file: null,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao registrar versão.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'Em Revisão':
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">Versões da Disciplina</CardTitle>
          <CardDescription>Histórico de revisões e entregas técnicas.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Registrar Nova Versão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nova Versão</DialogTitle>
              <DialogDescription>
                Adicione uma nova versão ou revisão para esta disciplina.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version_label">Versão</Label>
                  <Input
                    id="version_label"
                    placeholder="Ex: V1.0"
                    value={formData.version_label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, version_label: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revision">Revisão</Label>
                  <Input
                    id="revision"
                    placeholder="Ex: R01"
                    value={formData.revision}
                    onChange={(e) => setFormData((prev) => ({ ...prev, revision: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Alterações</Label>
                <Textarea
                  id="description"
                  placeholder="O que mudou nesta versão?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo (Opcional)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFormData((prev) => ({ ...prev, file }))
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_critical"
                  checked={formData.is_critical}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_critical: checked as boolean }))
                  }
                />
                <Label
                  htmlFor="is_critical"
                  className="font-normal cursor-pointer flex items-center gap-1.5"
                >
                  Marcar como versão crítica
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Salvando...' : 'Salvar Versão'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Carregando versões...
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">
                      Versão: {version.version_label}
                      {version.revision ? ` - Rev: ${version.revision}` : ''}
                    </h4>
                    {version.is_critical && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Crítica
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex items-center gap-1"
                    >
                      {getStatusIcon(version.status)}
                      {version.status}
                    </Badge>
                  </div>
                  {version.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {version.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {format(new Date(version.created), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    {version.expand?.approved_by && (
                      <>
                        <span>•</span>
                        <span>Aprovado por {version.expand.approved_by.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {version.file && (
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a
                        href={pb.files.getURL(version, version.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground border rounded-md bg-muted/20">
            Nenhuma versão registrada para esta disciplina.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
