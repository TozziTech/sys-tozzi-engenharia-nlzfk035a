import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export function ObraDadosGerais({
  project,
  onUpdate,
}: {
  project: any
  onUpdate: (p: any) => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    cno: project.cno || '',
    cnpj_obra: project.cnpj_obra || '',
    area_construida: project.area_construida || '',
    proprietario: project.proprietario || '',
    cep: project.cep || '',
    logradouro: project.logradouro || '',
    numero: project.numero || '',
    bairro: project.bairro || '',
    cidade: project.cidade || '',
    uf: project.uf || '',
  })
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await pb.collection('projects').update(project.id, formData)
      onUpdate(updated)
      toast({ title: 'Obra atualizada com sucesso!' })
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Gerais da Obra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CNO</Label>
            <Input name="cno" value={formData.cno} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ Específico da Obra</Label>
            <Input name="cnpj_obra" value={formData.cnpj_obra} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Área Construída (m²)</Label>
            <Input
              type="number"
              name="area_construida"
              value={formData.area_construida}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Proprietário</Label>
            <Input name="proprietario" value={formData.proprietario} onChange={handleChange} />
          </div>
        </div>

        <h3 className="text-lg font-medium mt-6">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input name="cep" value={formData.cep} onChange={handleChange} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Logradouro</Label>
            <Input name="logradouro" value={formData.logradouro} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input name="numero" value={formData.numero} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input name="bairro" value={formData.bairro} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input name="cidade" value={formData.cidade} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input name="uf" value={formData.uf} onChange={handleChange} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
