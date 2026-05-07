import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ApaCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectIdParam = searchParams.get('project')

  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    project: projectIdParam || '',
    positive_points: '',
    negative_points: '',
    lessons_learned: '',
    corrective_plan: '',
    status: 'concluído',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.project) {
      checkExistingApa(formData.project)
    }
  }, [formData.project])

  const loadData = async () => {
    try {
      const p = await pb.collection('projects').getFullList({
        sort: '-created',
      })
      setProjects(p)

      if (projectIdParam) {
        await checkExistingApa(projectIdParam)
      }
    } catch (error) {
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingApa = async (projId: string) => {
    try {
      const records = await pb.collection('apa_reports').getFullList({
        filter: `project = "${projId}"`,
      })
      if (records.length > 0) {
        const record = records[0]
        setExistingRecordId(record.id)
        setFormData({
          project: projId,
          positive_points: record.positive_points || '',
          negative_points: record.negative_points || '',
          lessons_learned: record.lessons_learned || '',
          corrective_plan: record.corrective_plan || '',
          status: record.status || 'concluído',
        })
      } else {
        setExistingRecordId(null)
        setFormData((prev) => ({
          ...prev,
          positive_points: '',
          negative_points: '',
          lessons_learned: '',
          corrective_plan: '',
        }))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.project) {
      toast.error('Selecione um projeto')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        created_by: user?.id,
      }

      if (existingRecordId) {
        await pb.collection('apa_reports').update(existingRecordId, payload)
        toast.success('APA atualizada com sucesso')
      } else {
        await pb.collection('apa_reports').create(payload)
        toast.success('APA criada com sucesso')
      }
      navigate('/apa/dashboard')
    } catch (error) {
      toast.error('Erro ao salvar APA')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análise Pós-Ação (APA)</h2>
          <p className="text-muted-foreground">
            Registre as lições aprendidas e crie um plano de ação para o projeto.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Formulário de APA</CardTitle>
            <CardDescription>
              {existingRecordId
                ? 'Você está editando uma APA existente (ou pendente).'
                : 'Preencha os dados abaixo para registrar uma nova APA.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select
                value={formData.project}
                onValueChange={(val) => setFormData({ ...formData, project: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Pontos Positivos (O que deu certo?)</Label>
                <Textarea
                  required
                  className="min-h-[150px]"
                  placeholder="Liste as práticas que funcionaram bem..."
                  value={formData.positive_points}
                  onChange={(e) => setFormData({ ...formData, positive_points: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Pontos Negativos (O que deu errado?)</Label>
                <Textarea
                  required
                  className="min-h-[150px]"
                  placeholder="Liste os problemas e dificuldades encontrados..."
                  value={formData.negative_points}
                  onChange={(e) => setFormData({ ...formData, negative_points: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Lições Aprendidas</Label>
                <Textarea
                  required
                  className="min-h-[150px]"
                  placeholder="O que aprendemos com este projeto?..."
                  value={formData.lessons_learned}
                  onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Plano de Ação Corretiva</Label>
                <Textarea
                  required
                  className="min-h-[150px]"
                  placeholder="Quais ações tomaremos para evitar que os problemas se repitam?..."
                  value={formData.corrective_plan}
                  onChange={(e) => setFormData({ ...formData, corrective_plan: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status da APA</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/apa/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar APA
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
