import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function CompanySettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()

  const [companyForm, setCompanyForm] = useState({
    id: '',
    company_name: '',
    cnpj: '',
    address: '',
    phone: '',
    logo: '',
    primary_color: '#0f172a',
    apa_trigger_days: 7,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [savingCompany, setSavingCompany] = useState(false)

  const PREDEFINED_PALETTES = [
    { name: 'Corporate Blue', color: '#1e3a8a' },
    { name: 'Industrial Gray', color: '#475569' },
    { name: 'Construction Orange', color: '#ea580c' },
    { name: 'Forest Green', color: '#166534' },
    { name: 'Deep Red', color: '#991b1b' },
  ]

  const handleQuickPalette = async (color: string) => {
    setCompanyForm((prev) => ({ ...prev, primary_color: color }))
    try {
      if (companyForm.id) {
        await pb.collection('company_settings').update(companyForm.id, { primary_color: color })
      } else {
        const formData = new FormData()
        formData.append('primary_color', color)
        if (companyForm.company_name) formData.append('company_name', companyForm.company_name)
        const res = await pb.collection('company_settings').create(formData)
        setCompanyForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Cor primária atualizada!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar cor', variant: 'destructive' })
    }
  }

  useEffect(() => {
    if (open) {
      pb.collection('company_settings')
        .getFirstListItem('')
        .then((record) => {
          setCompanyForm({
            id: record.id,
            company_name: record.company_name || '',
            cnpj: record.cnpj || '',
            address: record.address || '',
            phone: record.phone || '',
            logo: record.logo || '',
            primary_color: record.primary_color || '#0f172a',
            apa_trigger_days: record.apa_trigger_days || 7,
          })
          if (record.logo) {
            setLogoPreview(
              `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${record.id}/${record.logo}`,
            )
          }
        })
        .catch(() => {}) // Ignore if no settings exist yet
    }
  }, [open])

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 14) value = value.slice(0, 14)
    value = value.replace(/^(\d{2})(\d)/, '$1.$2')
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
    value = value.replace(/(\d{4})(\d)/, '$1-$2')
    setCompanyForm({ ...companyForm, cnpj: value })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
    value = value.replace(/(\d)(\d{4})$/, '$1-$2')
    setCompanyForm({ ...companyForm, phone: value })
  }

  const handleSaveCompany = async () => {
    setSavingCompany(true)
    try {
      const formData = new FormData()
      formData.append('company_name', companyForm.company_name)
      formData.append('cnpj', companyForm.cnpj)
      formData.append('address', companyForm.address)
      formData.append('phone', companyForm.phone)
      formData.append('primary_color', companyForm.primary_color)
      formData.append('apa_trigger_days', companyForm.apa_trigger_days.toString())
      if (logoFile) formData.append('logo', logoFile)

      if (companyForm.id) {
        await pb.collection('company_settings').update(companyForm.id, formData)
      } else {
        const res = await pb.collection('company_settings').create(formData)
        setCompanyForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Dados da empresa salvos com sucesso!' })
      onOpenChange(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar os dados da empresa', variant: 'destructive' })
    } finally {
      setSavingCompany(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dados da Empresa</DialogTitle>
          <DialogDescription>
            Configure as informações da empresa que aparecerão nos orçamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="modal_company_name">Razão Social / Nome Fantasia</Label>
            <Input
              id="modal_company_name"
              value={companyForm.company_name}
              onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal_cnpj">CNPJ</Label>
            <Input
              id="modal_cnpj"
              value={companyForm.cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal_address">Endereço Completo</Label>
            <Input
              id="modal_address"
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal_phone">Telefone</Label>
            <Input
              id="modal_phone"
              value={companyForm.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="modal_primary_color">Cor Primária (Identidade Visual)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="modal_primary_color"
                type="color"
                value={companyForm.primary_color || '#0f172a'}
                onChange={(e) => setCompanyForm({ ...companyForm, primary_color: e.target.value })}
                className="w-16 h-10 p-1 cursor-pointer rounded-md"
              />
              <Input
                type="text"
                value={companyForm.primary_color || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, primary_color: e.target.value })}
                placeholder="#000000"
                className="w-32 uppercase"
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-3 md:col-span-2 pt-2 border-t mt-2">
            <Label>Paletas de Cores Pré-definidas</Label>
            <div className="flex flex-wrap gap-3">
              {PREDEFINED_PALETTES.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  onClick={() => handleQuickPalette(palette.color)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    companyForm.primary_color === palette.color
                      ? 'border-slate-900 scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: palette.color }}
                  title={palette.name}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2 pt-2 border-t mt-2">
            <Label htmlFor="modal_apa_trigger">Dias para Acionar APA</Label>
            <Input
              id="modal_apa_trigger"
              type="number"
              min={1}
              value={companyForm.apa_trigger_days}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, apa_trigger_days: Number(e.target.value) })
              }
              placeholder="Ex: 7"
            />
            <p className="text-xs text-muted-foreground">
              Dias após a conclusão do projeto para gerar automaticamente o registro de Análise
              Pós-Ação (APA).
            </p>
          </div>
          <div className="space-y-2 md:col-span-2 pt-2 border-t mt-2">
            <Label htmlFor="modal_logo">Logotipo (PNG, JPG, SVG)</Label>
            <div className="flex items-center gap-4 mt-1">
              {logoPreview ? (
                <div className="relative h-16 w-32 border rounded-md overflow-hidden bg-white/50 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 w-32 border rounded-md border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                  Sem logo
                </div>
              )}
              <Input
                id="modal_logo"
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                className="flex-1"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveCompany} disabled={savingCompany}>
            {savingCompany ? 'Salvando...' : 'Salvar Empresa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
