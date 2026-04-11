import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User } from '@/types/project'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { maskCPF, maskRG, maskPhone, validateCPF } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

export function MemberForm({ onAdd }: { onAdd: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<User> & Record<string, any>>({
    codigo: '',
    name: '',
    role: 'Projetista',
    crea: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    phone: '',
    email: '',
    cpf: '',
    rg: '',
    birthDate: '',
    altPhone: '',
    status: 'Ativo',
    bankData: { bank: '', agency: '', account: '', pix: '' },
  })

  const [formacaoSelect, setFormacaoSelect] = useState('Engenheiro Civil')
  const [formacaoCustom, setFormacaoCustom] = useState('')

  useEffect(() => {
    if (open) {
      const fetchNextCodigo = async () => {
        try {
          const records = await pb.collection('users').getFullList({
            filter: 'codigo ~ "PER-"',
            fields: 'codigo',
          })

          let maxNum = 0
          for (const record of records) {
            const match = record.codigo.match(/PER-(\d+)/)
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNum) {
                maxNum = num
              }
            }
          }

          const nextNum = maxNum + 1
          setFormData((prev) => ({
            ...prev,
            codigo: `PER-${nextNum.toString().padStart(3, '0')}`,
          }))
        } catch (e) {
          console.error('Error fetching codigos', e)
        }
      }

      if (!formData.codigo) {
        fetchNextCodigo()
      }
    } else {
      setFormData({
        codigo: '',
        name: '',
        role: 'Projetista',
        crea: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        phone: '',
        email: '',
        cpf: '',
        rg: '',
        birthDate: '',
        altPhone: '',
        status: 'Ativo',
        bankData: { bank: '', agency: '', account: '', pix: '' },
      })
      setFormacaoSelect('Engenheiro Civil')
      setFormacaoCustom('')
      setFieldErrors({})
    }
  }, [open])

  const handleChange = (field: string, value: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    let maskedValue = value
    if (field === 'cpf') maskedValue = maskCPF(value)
    else if (field === 'rg') maskedValue = maskRG(value)
    else if (field === 'phone' || field === 'altPhone') maskedValue = maskPhone(value)

    if (field.startsWith('bank_')) {
      const bankField = field.replace('bank_', '')
      setFormData((prev) => ({
        ...prev,
        bankData: { ...prev.bankData!, [bankField]: maskedValue },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: maskedValue }))
    }
  }

  const handleSave = async () => {
    setFieldErrors({})

    if (!formData.name) {
      toast({
        title: 'Atenção',
        description: 'O nome do membro é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast({
        title: 'Atenção',
        description: 'O CPF informado é inválido.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.codigo) {
      setFieldErrors((prev) => ({ ...prev, codigo: 'O código é obrigatório.' }))
      return
    }

    const finalFormacao = formacaoSelect === 'Outros' ? formacaoCustom : formacaoSelect
    setLoading(true)

    try {
      try {
        const existing = await pb
          .collection('users')
          .getFirstListItem(`codigo = "${formData.codigo}"`)
        if (existing) {
          setFieldErrors((prev) => ({
            ...prev,
            codigo: 'Este código já está em uso por outro colaborador',
          }))
          setLoading(false)
          return
        }
      } catch (_) {
        // Not found, safe to proceed
      }

      const createdRecord = await pb.collection('users').create({
        email: formData.email || `temp_${Date.now()}@example.com`,
        password: 'password123',
        passwordConfirm: 'password123',
        name: formData.name,
        codigo: formData.codigo,
        formacao: finalFormacao,
        logradouro: formData.logradouro,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: formData.cep,
        crea: formData.crea,
        cpf: formData.cpf,
        rg: formData.rg,
        phone: formData.phone,
        status: formData.status,
      })

      const newUser: any = {
        ...createdRecord,
        specialty: finalFormacao,
        address: `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.uf}`,
        birthDate: formData.birthDate,
        altPhone: formData.altPhone,
        status: formData.status,
        bankData: formData.bankData as User['bankData'],
        assignedProjects: [],
      }

      onAdd(newUser as User)
      toast({ title: 'Sucesso', description: 'Membro adicionado à equipe com sucesso.' })
      setOpen(false)
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (errors.codigo || err.response?.data?.codigo?.code === 'validation_not_unique') {
        setFieldErrors((prev) => ({
          ...prev,
          codigo: 'Este código já está em uso por outro colaborador',
        }))
      } else if (errors.email) {
        toast({
          title: 'Email inválido ou já cadastrado',
          description: errors.email,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
        setFieldErrors(errors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo Membro</DialogTitle>
            <DialogDescription>
              Cadastre um novo profissional na equipe do sistema.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="grid gap-6 py-4 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Código (ID)</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => handleChange('codigo', e.target.value)}
                  placeholder="Ex: PER-001"
                  className={
                    fieldErrors.codigo ? 'border-destructive focus-visible:ring-destructive' : ''
                  }
                />
                {fieldErrors.codigo && (
                  <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.codigo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label>Cargo</Label>
                <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                    <SelectItem value="Projetista">Projetista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Em Férias">Em Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-3 sm:col-span-1">
                <Label>CREA</Label>
                <Input
                  value={formData.crea || ''}
                  onChange={(e) => handleChange('crea', e.target.value)}
                  placeholder="123456/UF"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Formação</Label>
                <Select value={formacaoSelect} onValueChange={setFormacaoSelect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                    <SelectItem value="Engenheiro Elétrico">Engenheiro Elétrico</SelectItem>
                    <SelectItem value="Engenheiro Mecânico">Engenheiro Mecânico</SelectItem>
                    <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                    <SelectItem value="Topógrafo">Topógrafo</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formacaoSelect === 'Outros' ? (
                <div className="space-y-2 col-span-2 sm:col-span-1 animate-in fade-in zoom-in duration-200">
                  <Label>Especifique a Formação</Label>
                  <Input
                    value={formacaoCustom}
                    onChange={(e) => setFormacaoCustom(e.target.value)}
                    placeholder="Sua formação..."
                  />
                </div>
              ) : (
                <div className="hidden sm:block col-span-1"></div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Telefone Alternativo</Label>
                <Input
                  value={formData.altPhone || ''}
                  onChange={(e) => handleChange('altPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="mt-2 pt-6 border-t border-border/50">
              <h4 className="font-semibold text-sm mb-4">Endereço</h4>
              <div className="grid grid-cols-12 gap-4">
                <div className="space-y-2 col-span-12 sm:col-span-8">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro || ''}
                    onChange={(e) => handleChange('logradouro', e.target.value)}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-4">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero || ''}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-5">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro || ''}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    placeholder="Centro"
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-4">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade || ''}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-3">
                  <Label>UF</Label>
                  <Input
                    value={formData.uf || ''}
                    onChange={(e) => handleChange('uf', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2 col-span-12 sm:col-span-4">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep || ''}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 pt-6 border-t border-border/50">
              <h4 className="font-semibold text-sm mb-4">Dados Pessoais</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpf || ''}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>RG</Label>
                  <Input
                    value={formData.rg || ''}
                    onChange={(e) => handleChange('rg', e.target.value)}
                    placeholder="00.000.000-0"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 pt-6 border-t border-border/50">
              <h4 className="font-semibold text-sm mb-4">Dados Bancários</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Banco</Label>
                  <Input
                    value={formData.bankData?.bank}
                    onChange={(e) => handleChange('bank_bank', e.target.value)}
                    placeholder="Ex: Itaú, Nubank"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Agência</Label>
                  <Input
                    value={formData.bankData?.agency}
                    onChange={(e) => handleChange('bank_agency', e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Conta Corrente</Label>
                  <Input
                    value={formData.bankData?.account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.bankData?.pix}
                    onChange={(e) => handleChange('bank_pix', e.target.value)}
                    placeholder="CPF, Email ou Celular"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/50 bg-muted/10">
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Membro
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
