import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Plus, Circle, Loader2, FileArchive, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface ProjectVersion {
  id: string
  version_label: string
  description: string
  file: string
  created: string
  status: string
  is_critical: boolean
  approved_by?: string
  approval_date?: string
  expand?: {
    approved_by?: {
      id: string
      name: string
      avatar: string
    }
  }
}

export function ModuleVersions({ moduleId }: { moduleId: string }) {
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const isAdminOrManager = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  const [formData, setFormData] = useState({
    version_label: '',
    description: '',
    is_critical: false,
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  const loadVersions = async () => {
    try {
      const records = await pb.collection('project_versions').getFullList<ProjectVersion>({
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
      data.append('is_critical', String(formData.is_critical))
      data.append('status', 'Pendente')
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
        is_critical: false,
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

  const handleStatusChange = async (versionId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'Aprovado') {
        updateData.approved_by = user?.id
        updateData.approval_date = new Date().toISOString()
      } else {
        updateData.approved_by = null
        updateData.approval_date = null
      }

      await pb.collection('project_versions').update(versionId, updateData)
      toast({
        title: 'Status atualizado',
        description: `A versão foi marcada como ${newStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Ocorreu um erro.',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Aprovado</Badge>
      case 'Em Revisão':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950">Em Revisão</Badge>
      default:
        return <Badge variant="secondary">Pendente</Badge>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_critical"
                  checked={formData.is_critical}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_critical: checked as boolean })
                  }
                />
                <Label htmlFor="is_critical" className="font-normal cursor-pointer">
                  Marcar como Versão Crítica
                </Label>
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
                <div
                  className={`flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card hover:bg-muted/50 transition-colors p-4 rounded-lg border shadow-sm ${v.is_critical ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10' : ''}`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-lg">{v.version_label}</span>
                      {v.is_critical && (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" /> Crítica
                        </Badge>
                      )}
                      {!isAdminOrManager && getStatusBadge(v.status || 'Pendente')}
                      <span className="text-xs font-medium text-muted-foreground ml-auto md:ml-2">
                        {format(new Date(v.created), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    {v.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap text-foreground/90">
                        {v.description}
                      </p>
                    )}
                    {v.status === 'Aprovado' && v.expand?.approved_by && v.approval_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Aprovado por{' '}
                        <span className="font-medium">{v.expand.approved_by.name}</span> em{' '}
                        {format(new Date(v.approval_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    {isAdminOrManager && (
                      <Select
                        value={v.status || 'Pendente'}
                        onValueChange={(val) => handleStatusChange(v.id, val)}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
