import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { validateCPF } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

const Field = ({ label, id, value, onChange, type = 'text', ...props }: any) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  </div>
)

export default function Profile() {
  const { user } = useAuth()
  const { can } = usePermissions()
  const canEditProfile = can('edit', 'profile')
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birth_date: '',
    phone: '',
    altPhone: '',
    formacao: '',
    crea: '',
    cpf: '',
    rg: '',
    codigo: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    banco_nome: '',
    agencia: '',
    conta: '',
    chave_pix: '',
    email_notifications_enabled: false,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [passData, setPassData] = useState({ oldPassword: '', password: '', passwordConfirm: '' })

  const loadData = async () => {
    if (!user?.id) return
    try {
      const record = await pb.collection('users').getOne(user.id)
      setFormData({
        name: record.name || '',
        email: record.email || '',
        birth_date: record.birth_date ? record.birth_date.split('T')[0] : '',
        phone: record.phone || '',
        altPhone: record.altPhone || '',
        formacao: record.formacao || '',
        crea: record.crea || '',
        cpf: record.cpf || '',
        rg: record.rg || '',
        codigo: record.codigo || '',
        cep: record.cep || '',
        logradouro: record.logradouro || '',
        numero: record.numero || '',
        bairro: record.bairro || '',
        cidade: record.cidade || '',
        uf: record.uf || '',
        banco_nome: record.banco_nome || '',
        agencia: record.agencia || '',
        conta: record.conta || '',
        chave_pix: record.chave_pix || '',
        email_notifications_enabled: record.email_notifications_enabled || false,
      })
      if (record.avatar) setAvatarPreview(pb.files.getURL(record, record.avatar))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro)
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
          }))
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleChange = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (key === 'cep' && value.replace(/\D/g, '').length === 8) fetchCep(value)
  }

  const handleSave = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      if (formData.cpf && !validateCPF(formData.cpf)) {
        toast({ title: 'CPF Inválido', variant: 'destructive' })
        setLoading(false)
        return
      }
      const data = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'email') return // API requirement: avoid auth field conflicts

        if (k === 'birth_date') {
          if (v) {
            data.append(k, String(v).substring(0, 10)) // Format YYYY-MM-DD
          } else {
            data.append(k, '')
          }
        } else if (typeof v === 'boolean') {
          data.append(k, v ? 'true' : 'false')
        } else {
          data.append(k, String(v))
        }
      })

      if (avatarFile) data.append('avatar', avatarFile)

      await pb.collection('users').update(user.id, data)
      toast({ title: 'Perfil atualizado com sucesso!' })
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar perfil', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = async () => {
    if (!user?.id) return
    if (passData.password !== passData.passwordConfirm)
      return toast({ title: 'Senhas não coincidem', variant: 'destructive' })
    setPassLoading(true)
    try {
      await pb.collection('users').update(user.id, passData)
      toast({ title: 'Senha atualizada com sucesso!' })
      setPassData({ oldPassword: '', password: '', passwordConfirm: '' })
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar senha', description: e.message, variant: 'destructive' })
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="mb-8 flex items-center gap-6">
        <Avatar className="h-20 w-20 shadow-md border-2 border-primary/20">
          <AvatarImage
            src={avatarPreview || 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1'}
          />
          <AvatarFallback>{formData.name.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            {user?.role} • {formData.codigo}
          </p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6 h-auto">
          <TabsTrigger value="personal" className="py-2">
            Pessoal
          </TabsTrigger>
          <TabsTrigger value="professional" className="py-2">
            Profissional
          </TabsTrigger>
          <TabsTrigger value="address" className="py-2">
            Endereço
          </TabsTrigger>
          <TabsTrigger value="bank" className="py-2">
            Bancário
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2">
            Segurança
          </TabsTrigger>
        </TabsList>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <TabsContent value="personal" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Nome Completo"
                value={formData.name}
                onChange={(v: string) => handleChange('name', v)}
              />
              <Field
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(v: string) => handleChange('email', v)}
                disabled
              />
              <Field
                label="Data de Nascimento"
                type="date"
                value={formData.birth_date}
                onChange={(v: string) => handleChange('birth_date', v)}
              />
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setAvatarFile(f)
                      setAvatarPreview(URL.createObjectURL(f))
                    }
                  }}
                />
              </div>
              <Field
                label="Telefone Principal"
                value={formData.phone}
                onChange={(v: string) => handleChange('phone', v)}
                placeholder="(00) 00000-0000"
              />
              <Field
                label="Telefone Secundário"
                value={formData.altPhone}
                onChange={(v: string) => handleChange('altPhone', v)}
                placeholder="(00) 00000-0000"
              />
            </div>
            {canEditProfile && (
              <Button onClick={handleSave} disabled={loading} className="mt-4">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="professional" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Código do Usuário"
                value={formData.codigo}
                onChange={(v: string) => handleChange('codigo', v)}
              />
              <Field
                label="Formação"
                value={formData.formacao}
                onChange={(v: string) => handleChange('formacao', v)}
              />
              <Field
                label="CREA/CAU"
                value={formData.crea}
                onChange={(v: string) => handleChange('crea', v)}
              />
              <Field
                label="CPF"
                value={formData.cpf}
                onChange={(v: string) => handleChange('cpf', v)}
              />
              <Field
                label="RG"
                value={formData.rg}
                onChange={(v: string) => handleChange('rg', v)}
              />
            </div>
            {canEditProfile && (
              <Button onClick={handleSave} disabled={loading} className="mt-4">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="CEP"
                value={formData.cep}
                onChange={(v: string) => handleChange('cep', v)}
                placeholder="00000-000"
                className="md:col-span-1"
              />
              <Field
                label="Logradouro"
                value={formData.logradouro}
                onChange={(v: string) => handleChange('logradouro', v)}
                className="md:col-span-2"
              />
              <Field
                label="Número"
                value={formData.numero}
                onChange={(v: string) => handleChange('numero', v)}
              />
              <Field
                label="Bairro"
                value={formData.bairro}
                onChange={(v: string) => handleChange('bairro', v)}
              />
              <Field
                label="Cidade"
                value={formData.cidade}
                onChange={(v: string) => handleChange('cidade', v)}
              />
              <Field
                label="UF"
                value={formData.uf}
                onChange={(v: string) => handleChange('uf', v)}
                maxLength={2}
              />
            </div>
            {canEditProfile && (
              <Button onClick={handleSave} disabled={loading} className="mt-4">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="bank" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Banco"
                value={formData.banco_nome}
                onChange={(v: string) => handleChange('banco_nome', v)}
              />
              <Field
                label="Agência"
                value={formData.agencia}
                onChange={(v: string) => handleChange('agencia', v)}
              />
              <Field
                label="Conta"
                value={formData.conta}
                onChange={(v: string) => handleChange('conta', v)}
              />
              <Field
                label="Chave PIX"
                value={formData.chave_pix}
                onChange={(v: string) => handleChange('chave_pix', v)}
              />
            </div>
            {canEditProfile && (
              <Button onClick={handleSave} disabled={loading} className="mt-4">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-8 mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Preferências de Notificação</h3>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas e atualizações importantes no seu e-mail.
                  </p>
                </div>
                <Switch
                  checked={formData.email_notifications_enabled}
                  disabled={!canEditProfile}
                  onCheckedChange={(v) => {
                    handleChange('email_notifications_enabled', v)
                    setTimeout(handleSave, 100)
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Alterar Senha</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={passData.oldPassword}
                    onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input
                    type="password"
                    value={passData.password}
                    onChange={(e) => setPassData({ ...passData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type="password"
                    value={passData.passwordConfirm}
                    onChange={(e) => setPassData({ ...passData, passwordConfirm: e.target.value })}
                  />
                </div>
              </div>
              {canEditProfile && (
                <Button
                  variant="destructive"
                  onClick={handlePassword}
                  disabled={passLoading || !passData.password}
                >
                  {passLoading ? 'Alterando...' : 'Atualizar Senha'}
                </Button>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
