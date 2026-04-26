import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import useProjectStore from '@/stores/useProjectStore'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { useThemeColor } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { user } = useAuth()
  const { slackWebhookUrl, setSlackWebhookUrl } = useProjectStore()
  const [webhookInput, setWebhookInput] = useState(slackWebhookUrl)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { themeColor, setThemeColor } = useThemeColor()

  const [companyForm, setCompanyForm] = useState({
    id: '',
    company_name: '',
    cnpj: '',
    address: '',
    phone: '',
    logo: '',
    primary_color: '#D4AF37',
    background_color: '',
    background_preset: '',
    contact_alert_days: 30,
  })
  const [jsonConfigs, setJsonConfigs] = useState({
    module_visibility: '{}',
    role_permissions: '{}',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [savingCompany, setSavingCompany] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    id: '',
    recipients: '',
    frequency: 'Semanal',
    active: false,
  })
  const [savingSchedule, setSavingSchedule] = useState(false)

  const colors = [
    { name: 'Zinc', value: 'zinc', colorClass: 'bg-zinc-900 dark:bg-zinc-100' },
    { name: 'Blue', value: 'blue', colorClass: 'bg-blue-600' },
    { name: 'Green', value: 'green', colorClass: 'bg-green-600' },
    { name: 'Rose', value: 'rose', colorClass: 'bg-rose-600' },
    { name: 'Orange', value: 'orange', colorClass: 'bg-orange-500' },
    { name: 'Gold', value: 'gold', colorClass: 'bg-[#D4AF37]' },
  ] as const

  useEffect(() => {
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
          primary_color: record.primary_color || '#D4AF37',
          background_color: record.background_color || '',
          background_preset: record.background_preset || '',
          contact_alert_days: record.contact_alert_days || 30,
        })
        setJsonConfigs({
          module_visibility: JSON.stringify(record.module_visibility || {}, null, 2),
          role_permissions: JSON.stringify(record.role_permissions || {}, null, 2),
        })
        if (record.logo)
          setLogoPreview(
            `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${record.id}/${record.logo}`,
          )
      })
      .catch(() => {})

    pb.collection('report_schedules')
      .getFirstListItem('')
      .then((record) => {
        setScheduleForm({
          id: record.id,
          recipients: record.recipients || '',
          frequency: record.frequency || 'Semanal',
          active: record.active || false,
        })
      })
      .catch(() => {})
  }, [])

  if (user?.role !== 'Administrador') return <Navigate to="/" replace />

  const handleSaveCompany = async () => {
    setSavingCompany(true)
    try {
      const formData = new FormData()
      formData.append('company_name', companyForm.company_name)
      formData.append('cnpj', companyForm.cnpj)
      formData.append('address', companyForm.address)
      formData.append('phone', companyForm.phone)
      formData.append('primary_color', companyForm.primary_color)
      formData.append('background_color', companyForm.background_color)
      formData.append('background_preset', companyForm.background_preset)
      formData.append('contact_alert_days', companyForm.contact_alert_days.toString())
      if (logoFile) formData.append('logo', logoFile)

      try {
        formData.append(
          'module_visibility',
          JSON.stringify(JSON.parse(jsonConfigs.module_visibility)),
        )
        formData.append(
          'role_permissions',
          JSON.stringify(JSON.parse(jsonConfigs.role_permissions)),
        )
      } catch (e) {
        toast({ title: 'JSON Inválido. Verifique a formatação.', variant: 'destructive' })
        setSavingCompany(false)
        return
      }

      if (companyForm.id) await pb.collection('company_settings').update(companyForm.id, formData)
      else {
        const res = await pb.collection('company_settings').create(formData)
        setCompanyForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Configurações salvas com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    try {
      const data = {
        recipients: scheduleForm.recipients,
        frequency: scheduleForm.frequency,
        active: scheduleForm.active,
      }
      if (scheduleForm.id) await pb.collection('report_schedules').update(scheduleForm.id, data)
      else {
        const res = await pb.collection('report_schedules').create(data)
        setScheduleForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Agendamento salvo!' })
    } catch (e) {
      toast({ title: 'Erro ao salvar agendamento', variant: 'destructive' })
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais da empresa, integrações e parâmetros da plataforma.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidade e Contato da Empresa</CardTitle>
            <CardDescription>
              Informações globais utilizadas em relatórios e no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={companyForm.cnpj}
                  onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Logotipo</Label>
                <div className="flex items-center gap-4 mt-1">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-16 object-contain border rounded p-1 bg-white/10"
                    />
                  ) : (
                    <div className="h-16 w-32 border border-dashed rounded flex items-center justify-center text-xs">
                      Sem logo
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setLogoFile(f)
                        setLogoPreview(URL.createObjectURL(f))
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Modo de Exibição</Label>
              <RadioGroup value={theme} onValueChange={setTheme} className="flex gap-4">
                {[
                  { v: 'light', i: Sun, l: 'Claro' },
                  { v: 'dark', i: Moon, l: 'Escuro' },
                  { v: 'system', i: Monitor, l: 'Sistema' },
                ].map((t) => (
                  <Label
                    key={t.v}
                    className="flex flex-col items-center border-2 rounded p-4 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem value={t.v} className="sr-only" />
                    <t.i className="mb-2 h-5 w-5" />
                    {t.l}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label>Cor Primária do Tema</Label>
              <div className="flex gap-3">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setThemeColor(c.value)}
                    className={cn(
                      'h-10 w-10 rounded-full border-2',
                      themeColor === c.value ? 'border-primary scale-110' : 'border-transparent',
                    )}
                  >
                    <div className={cn('w-full h-full rounded-full', c.colorClass)} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Operacionais</CardTitle>
            <CardDescription>Parâmetros de funcionamento e permissões globais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Alerta de Retorno de Contatos (Dias)</Label>
              <Input
                type="number"
                value={companyForm.contact_alert_days}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, contact_alert_days: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t">
              <div className="space-y-2">
                <Label>Visibilidade de Módulos (JSON)</Label>
                <Textarea
                  className="font-mono text-xs h-40"
                  value={jsonConfigs.module_visibility}
                  onChange={(e) =>
                    setJsonConfigs({ ...jsonConfigs, module_visibility: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Permissões de Cargos (JSON)</Label>
                <Textarea
                  className="font-mono text-xs h-40"
                  value={jsonConfigs.role_permissions}
                  onChange={(e) =>
                    setJsonConfigs({ ...jsonConfigs, role_permissions: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveCompany} disabled={savingCompany}>
                {savingCompany ? 'Salvando...' : 'Salvar Configurações Globais'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Agendados & Slack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Webhook Slack</Label>
                <Input value={webhookInput} onChange={(e) => setWebhookInput(e.target.value)} />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSlackWebhookUrl(webhookInput)
                  toast({ title: 'Slack salvo' })
                }}
              >
                Salvar Slack
              </Button>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Ativar Envio Automático de Relatórios</Label>
                <Switch
                  checked={scheduleForm.active}
                  onCheckedChange={(v) => setScheduleForm({ ...scheduleForm, active: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destinatários</Label>
                  <Input
                    value={scheduleForm.recipients}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, recipients: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={scheduleForm.frequency}
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diário">Diário</SelectItem>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
                  Salvar Agendamentos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
