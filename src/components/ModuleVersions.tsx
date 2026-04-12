import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, Plus, AlertTriangle, CheckCircle, Clock, History, Printer } from 'lucide-react'
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

export function ModuleVersions({ module }: { module: any }) {
  const moduleId = module.id
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState<string | null>(null)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
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

  const openHistory = async (versionId: string) => {
    setHistoryOpen(versionId)
    try {
      const logs = await pb.collection('audit_logs').getFullList({
        filter: `resource = 'project_versions' && details.version_id = '${versionId}'`,
        sort: '-created',
        expand: 'user_id',
      })
      setVersionHistory(logs)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="hidden print:block w-full text-black">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Relatório de Auditoria de Versões</h2>
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <strong>Projeto:</strong> {module.expand?.project?.name || 'N/A'}
            </p>
            <p>
              <strong>Disciplina:</strong> {module.name}
            </p>
            <p>
              <strong>Data de Emissão:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2">Versão</th>
              <th className="py-2">Revisão</th>
              <th className="py-2">Status</th>
              <th className="py-2">Crítica</th>
              <th className="py-2">Responsável</th>
              <th className="py-2">Data Criação</th>
              <th className="py-2">Data Aprovação</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-gray-300">
                <td className="py-2">{v.version_label}</td>
                <td className="py-2">{v.revision || '-'}</td>
                <td className="py-2">{v.status}</td>
                <td className="py-2">{v.is_critical ? 'Sim' : 'Não'}</td>
                <td className="py-2">{v.expand?.approved_by?.name || '-'}</td>
                <td className="py-2">{format(new Date(v.created), 'dd/MM/yyyy')}</td>
                <td className="py-2">
                  {v.approval_date ? format(new Date(v.approval_date), 'dd/MM/yyyy') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Versões da Disciplina</CardTitle>
            <CardDescription>Histórico de revisões e entregas técnicas.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Relatório</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Versão</span>
                  <span className="sm:hidden">Nova</span>
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
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, revision: e.target.value }))
                        }
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
          </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openHistory(version.id)}
                      title="Histórico de Alterações"
                    >
                      <History className="h-4 w-4" />
                    </Button>
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

      <Dialog open={!!historyOpen} onOpenChange={(val) => !val && setHistoryOpen(null)}>
        <DialogContent className="sm:max-w-[600px] print:hidden">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>Registro de auditoria para esta versão.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
            {versionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum registro de alteração encontrado.
              </p>
            ) : (
              versionHistory.map((log) => (
                <div key={log.id} className="text-sm border-b pb-4 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{log.expand?.user_id?.name || 'Sistema'}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-xs space-y-2">
                    {log.details?.changes &&
                      Object.entries(log.details.changes).map(([field, vals]: any) => (
                        <div
                          key={field}
                          className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                        >
                          <span className="font-medium capitalize w-24 shrink-0">{field}:</span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-destructive line-through truncate max-w-[45%]">
                              {String(vals.old || '(vazio)')}
                            </span>
                            <span className="text-muted-foreground shrink-0">→</span>
                            <span className="text-emerald-600 font-medium truncate max-w-[45%]">
                              {String(vals.new || '(vazio)')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
