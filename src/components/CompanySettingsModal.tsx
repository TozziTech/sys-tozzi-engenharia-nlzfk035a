import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Settings } from 'lucide-react'

export function CompanySettingsModal() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    company_name: '',
    cnpj: '',
    address: '',
    phone: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    try {
      const records = await pb.collection('company_settings').getFullList()
      if (records.length > 0) {
        setSettings(records[0])
        setForm({
          company_name: records[0].company_name || '',
          cnpj: records[0].cnpj || '',
          address: records[0].address || '',
          phone: records[0].phone || '',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('company_name', form.company_name)
      formData.append('cnpj', form.cnpj)
      formData.append('address', form.address)
      formData.append('phone', form.phone)
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      if (settings?.id) {
        await pb.collection('company_settings').update(settings.id, formData)
      } else {
        await pb.collection('company_settings').create(formData)
      }
      toast({ title: 'Configurações salvas' })
      setOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" /> Configurar Papel Timbrado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Papel Timbrado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da Empresa</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Logo</Label>
            <Input
              type="file"
              accept="image/jpeg, image/png, image/svg+xml"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
            {settings?.logo && !logoFile && (
              <p className="text-sm text-muted-foreground mt-1">Logo atual salva no sistema.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
