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
import { useState, useEffect } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { useThemeColor } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { slackWebhookUrl, setSlackWebhookUrl } = useProjectStore()
  const [webhookInput, setWebhookInput] = useState(slackWebhookUrl)
  const { toast } = useToast()

  const { theme, setTheme } = useTheme()
  const { themeColor, setThemeColor } = useThemeColor()

  // Company Settings State
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
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [savingCompany, setSavingCompany] = useState(false)

  // Scheduled Reports State
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

  const PREDEFINED_PALETTES = [
    { name: 'Gold / Dourado', color: '#D4AF37' },
    { name: 'Corporate Blue', color: '#1e3a8a' },
    { name: 'Industrial Gray', color: '#475569' },
    { name: 'Construction Orange', color: '#ea580c' },
    { name: 'Forest Green', color: '#166534' },
    { name: 'Deep Red', color: '#991b1b' },
  ]

  const BG_PRESETS = [
    { name: 'Slate', color: '#0f172a' },
    { name: 'Zinc', color: '#18181b' },
    { name: 'Neutral', color: '#171717' },
    { name: 'Deep Navy', color: '#0a192f' },
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
      toast({ title: 'Cor primária atualizada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar cor', variant: 'destructive' })
    }
  }

  const handleApplyBg = async (color: string, presetName: string) => {
    setCompanyForm((prev) => ({ ...prev, background_color: color, background_preset: presetName }))
    try {
      if (companyForm.id) {
        await pb.collection('company_settings').update(companyForm.id, {
          background_color: color,
          background_preset: presetName,
        })
      } else {
        const formData = new FormData()
        formData.append('background_color', color)
        formData.append('background_preset', presetName)
        if (companyForm.company_name) formData.append('company_name', companyForm.company_name)
        const res = await pb.collection('company_settings').create(formData)
        setCompanyForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Cor de fundo atualizada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar cor de fundo', variant: 'destructive' })
    }
  }

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
        })
        if (record.logo) {
          setLogoPreview(
            `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${record.id}/${record.logo}`,
          )
        }
      })
      .catch(() => {}) // Ignore if no settings exist yet

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
      formData.append('background_color', companyForm.background_color)
      formData.append('background_preset', companyForm.background_preset)
      if (logoFile) formData.append('logo', logoFile)

      if (companyForm.id) {
        await pb.collection('company_settings').update(companyForm.id, formData)
      } else {
        const res = await pb.collection('company_settings').create(formData)
        setCompanyForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Dados da empresa salvos com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao salvar os dados da empresa', variant: 'destructive' })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleSaveSlack = () => {
    setSlackWebhookUrl(webhookInput)
    toast({
      title: 'Integração atualizada',
      description: 'A configuração do Webhook do Slack foi salva.',
    })
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    try {
      const data = {
        recipients: scheduleForm.recipients,
        frequency: scheduleForm.frequency,
        active: scheduleForm.active,
      }
      if (scheduleForm.id) {
        await pb.collection('report_schedules').update(scheduleForm.id, data)
      } else {
        const res = await pb.collection('report_schedules').create(data)
        setScheduleForm((prev) => ({ ...prev, id: res.id }))
      }
      toast({ title: 'Agendamento salvo com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao salvar agendamento', variant: 'destructive' })
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie as preferências da sua conta e do sistema.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>
              Gerencie as informações corporativas e o logotipo para os relatórios e exportações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social / Nome Fantasia</Label>
                <Input
                  id="company_name"
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={companyForm.cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={companyForm.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2 pt-2 border-t mt-2">
                <Label htmlFor="logo">Logotipo (PNG, JPG, SVG)</Label>
                <div className="flex items-center gap-4 mt-1">
                  {logoPreview ? (
                    <div className="relative h-16 w-32 border rounded-md overflow-hidden bg-white/50 dark:bg-white/10 flex items-center justify-center">
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
                    id="logo"
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
            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveCompany} disabled={savingCompany}>
                {savingCompany ? 'Salvando...' : 'Salvar Empresa'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize o tema e as cores da interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base">Modo de Exibição</Label>
                <RadioGroup
                  defaultValue={theme}
                  value={theme}
                  onValueChange={(val) => setTheme(val)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      Claro
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      Escuro
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      Sistema
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">Cor Primária (Tema)</Label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setThemeColor(c.value)}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                        themeColor === c.value
                          ? 'border-primary scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105',
                      )}
                      aria-label={`Selecionar cor ${c.name}`}
                    >
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full border border-black/10 dark:border-white/10',
                          c.colorClass,
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">Cor Primária (Identidade Visual / Relatórios)</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={companyForm.primary_color || '#D4AF37'}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, primary_color: e.target.value })
                      }
                      className="w-16 h-10 p-1 cursor-pointer rounded-md"
                    />
                    <Input
                      type="text"
                      value={companyForm.primary_color || '#D4AF37'}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, primary_color: e.target.value })
                      }
                      placeholder="#000000"
                      className="w-32 uppercase"
                      maxLength={7}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleQuickPalette(companyForm.primary_color)}
                    >
                      Aplicar Cor
                    </Button>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Paletas Rápidas (Aplica e salva imediatamente)
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {PREDEFINED_PALETTES.map((palette) => (
                        <button
                          key={palette.color}
                          type="button"
                          onClick={() => handleQuickPalette(palette.color)}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                            companyForm.primary_color === palette.color
                              ? 'border-slate-900 dark:border-slate-100 scale-110 shadow-sm'
                              : 'border-transparent hover:scale-105',
                          )}
                          style={{ backgroundColor: palette.color }}
                          title={palette.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">Cor de Fundo (Background)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Personalize a cor de fundo do sistema. O texto e os cartões serão ajustados
                  automaticamente para garantir o contraste.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {BG_PRESETS.map((p) => (
                    <Button
                      key={p.name}
                      type="button"
                      variant={companyForm.background_preset === p.name ? 'default' : 'outline'}
                      onClick={() => handleApplyBg(p.color, p.name)}
                      className="flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={!companyForm.background_color ? 'default' : 'outline'}
                    onClick={() => handleApplyBg('', '')}
                  >
                    Padrão do Tema
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm text-muted-foreground">
                    Ou escolha uma cor personalizada:
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={companyForm.background_color || '#ffffff'}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          background_color: e.target.value,
                          background_preset: 'Custom',
                        })
                      }
                      className="w-16 h-10 p-1 cursor-pointer rounded-md"
                    />
                    <Input
                      type="text"
                      value={companyForm.background_color || ''}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          background_color: e.target.value,
                          background_preset: 'Custom',
                        })
                      }
                      placeholder="#000000"
                      className="w-32 uppercase"
                      maxLength={7}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleApplyBg(companyForm.background_color, 'Custom')}
                    >
                      Aplicar Cor
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue="Eduardo Costa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" defaultValue="eduardo@archbuild.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo / Ocupação</Label>
              <Input
                id="role"
                defaultValue="Gestor de Projetos"
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button>Salvar Perfil</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>Configure conexões com aplicativos externos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Slack Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Envie alertas automáticos para um canal do Slack.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveSlack}>Salvar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências de Notificação</CardTitle>
            <CardDescription>Escolha como e quando deseja ser notificado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Resumo Semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Receba um relatório por e-mail com o status geral dos projetos.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Alertas de Atraso</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações imediatas quando uma tarefa ou projeto estiver atrasado.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Atividades da Equipe</Label>
                <p className="text-sm text-muted-foreground">
                  Avisos sobre comentários e mudanças feitas por outros membros.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Agendados</CardTitle>
            <CardDescription>
              Configure o envio automático do Relatório Executivo por e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Ativar Envio Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita a geração e envio automático do relatório para os e-mails configurados.
                </p>
              </div>
              <Switch
                checked={scheduleForm.active}
                onCheckedChange={(checked) => setScheduleForm({ ...scheduleForm, active: checked })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="recipients">E-mails dos Destinatários</Label>
                <Input
                  id="recipients"
                  placeholder="gestor1@empresa.com, gestor2@empresa.com"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Separe múltiplos e-mails com vírgula.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência de Envio</Label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={(val) => setScheduleForm({ ...scheduleForm, frequency: val })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diário">Diário (8:00 AM)</SelectItem>
                    <SelectItem value="Semanal">Semanal (Segunda-feira)</SelectItem>
                    <SelectItem value="Mensal">Mensal (Dia 1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
                {savingSchedule ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
