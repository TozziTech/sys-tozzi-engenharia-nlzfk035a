import { useState, useEffect, useCallback, memo } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { User } from '@/types/project'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { maskCPF, maskRG, maskPhone, validateCPF } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'

const ROLE_PREFIXES: Record<string, string> = {
  Administrador: 'ADM',
  'Gerente de Projeto': 'GER',
  Projetista: 'PROJ',
  Estagiário: 'ESTG',
  Visitante: 'VIST',
  Cliente: 'CLI',
}

const maskCEP = (val: string) =>
  val
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)

const formSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    codigo: z.string().trim().min(1, 'O código é obrigatório.'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
    role: z
      .enum([
        'Administrador',
        'Gerente de Projeto',
        'Projetista',
        'Estagiário',
        'Visitante',
        'Cliente',
      ])
      .default('Projetista'),
    status: z.enum(['Ativo', 'Inativo', 'Em Férias', 'Pendente']).default('Ativo'),
    crea: z.string().optional().default(''),
    formacaoSelect: z.string().default('Engenheiro Civil'),
    formacaoCustom: z.string().optional().default(''),
    email: z.string().email('Email inválido.').min(1, 'O email é obrigatório.'),
    phone: z.string().optional().default(''),
    altPhone: z.string().optional().default(''),
    logradouro: z.string().optional().default(''),
    numero: z.string().optional().default(''),
    bairro: z.string().optional().default(''),
    cidade: z.string().optional().default(''),
    uf: z.string().optional().default(''),
    cep: z.string().optional().default(''),
    cpf: z.string().optional().default(''),
    rg: z.string().optional().default(''),
    birth_date: z.string().optional().default(''),
    bank_bank: z.string().optional().default(''),
    bank_agency: z.string().optional().default(''),
    bank_account: z.string().optional().default(''),
    bank_pix: z.string().optional().default(''),
    documentos_link: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  })
  .refine((data) => !data.documentos_link || URL.canParse(data.documentos_link), {
    message: 'Insira uma URL válida.',
    path: ['documentos_link'],
  })
  .refine((data) => !(data.formacaoSelect === 'Outros' && !data.formacaoCustom), {
    message: 'Especifique a formação.',
    path: ['formacaoCustom'],
  })
  .refine(
    (data) => !(data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validateCPF(data.cpf)),
    { message: 'CPF inválido.', path: ['cpf'] },
  )

type FormValues = z.infer<typeof formSchema>

// Stabilized sub-components to prevent unmounting/remounting cycles that break active element
const FormacaoCustomField = memo(function FormacaoCustomField({ control }: { control: any }) {
  const formacao = useWatch({ control, name: 'formacaoSelect' })
  if (formacao !== 'Outros') return null

  return (
    <FormField
      control={control}
      name="formacaoCustom"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Especifique</FormLabel>
          <FormControl>
            <Input
              id="member-formacao-custom"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Sua formação..."
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
})

const SubmitButton = memo(function SubmitButton({
  control,
  loading,
  onCancel,
}: {
  control: any
  loading: boolean
  onCancel: () => void
}) {
  const codigo = useWatch({ control, name: 'codigo' })
  const isCodigoValid = !!codigo?.trim()

  return (
    <div className="p-6 pt-4 border-t bg-muted/10">
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !isCodigoValid}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Membro
        </Button>
      </DialogFooter>
    </div>
  )
})

const DEFAULT_VALUES: FormValues = {
  name: '',
  codigo: '',
  password: '',
  role: 'Projetista',
  status: 'Ativo',
  crea: '',
  formacaoSelect: 'Engenheiro Civil',
  formacaoCustom: '',
  email: '',
  phone: '',
  altPhone: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  cpf: '',
  rg: '',
  birth_date: '',
  bank_bank: '',
  bank_agency: '',
  bank_account: '',
  bank_pix: '',
  documentos_link: '',
  notes: '',
}

export function MemberForm({
  onAdd,
  onOpenChange,
}: {
  onAdd?: (user: User) => void
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      onOpenChange?.(newOpen)
    },
    [onOpenChange],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Load offline draft
  useEffect(() => {
    if (!open) return
    const draft = localStorage.getItem('memberFormDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        form.reset({ ...DEFAULT_VALUES, ...parsed })
        toast({
          title: 'Rascunho recuperado',
          description: 'Seus dados não salvos foram recuperados localmente.',
        })
      } catch (e) {
        console.error('Failed to parse draft', e)
      }
    }
  }, [open, form, toast])

  const handleMaskedChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      maskFn: (v: string) => string,
      onChange: (v: string) => void,
    ) => {
      const input = e.target
      const oldVal = input.value
      const oldCursor = input.selectionStart || 0
      const unmaskedBeforeCursor = oldVal.slice(0, oldCursor).replace(/\D/g, '')
      const newVal = maskFn(oldVal)
      onChange(newVal)

      if (document.activeElement === input) {
        window.requestAnimationFrame(() => {
          if (input && document.activeElement === input) {
            let newCursor = 0,
              digitsFound = 0
            for (let i = 0; i < newVal.length; i++) {
              if (/\d/.test(newVal[i])) digitsFound++
              if (digitsFound === unmaskedBeforeCursor.length) {
                newCursor = i + 1
                while (newCursor < newVal.length && !/\d/.test(newVal[newCursor])) newCursor++
                break
              }
            }
            if (unmaskedBeforeCursor.length === 0) newCursor = 0
            input.setSelectionRange(newCursor, newCursor)
          }
        })
      }
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    let isMounted = true

    const updateCodigo = async (currentRole: string) => {
      const prefix = ROLE_PREFIXES[currentRole] || 'PER'
      try {
        const records = await pb
          .collection('users')
          .getFullList({ filter: `codigo ~ "^${prefix}-"`, fields: 'codigo' })
        let maxNum = 0
        for (const record of records) {
          const match = record.codigo.match(new RegExp(`^${prefix}-(\\d+)`))
          if (match && parseInt(match[1], 10) > maxNum) maxNum = parseInt(match[1], 10)
        }
        if (isMounted) {
          form.setValue('codigo', `${prefix}-${(maxNum + 1).toString().padStart(3, '0')}`, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch (e: any) {
        if (e.status !== 0) console.error('Error fetching codigos', e)
      }
    }

    // Subscribe to changes to prevent re-rendering the whole form and handle drafts
    const subscription = form.watch((value, { name }) => {
      if (name === 'role') {
        updateCodigo(value.role || 'Projetista')
      }
      // Save offline draft on any change
      localStorage.setItem('memberFormDraft', JSON.stringify(value))
    })

    // If it's a new form without a draft, init codigo
    if (!localStorage.getItem('memberFormDraft')) {
      updateCodigo(form.getValues('role') || 'Projetista')
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [open, form])

  const fetchCep = useCallback(
    async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '')
      if (cleanCep.length === 8) {
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
          const data = await res.json()
          if (!data.erro) {
            const opts = { shouldValidate: true, shouldDirty: true }
            form.setValue('logradouro', data.logradouro || '', opts)
            form.setValue('bairro', data.bairro || '', opts)
            form.setValue('cidade', data.localidade || '', opts)
            form.setValue('uf', data.uf || '', opts)
            // Auto focus number field after successful CEP fetch
            setTimeout(() => {
              document.getElementById('member-numero')?.focus()
            }, 100)
          } else {
            toast({ title: 'CEP não encontrado', variant: 'destructive' })
          }
        } catch {
          toast({ title: 'Erro ao buscar CEP', variant: 'destructive' })
        }
      }
    },
    [form, toast],
  )

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, form])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect
    try {
      const payload: any = {
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        name: data.name,
        codigo: data.codigo,
        role: data.role,
        formacao: finalFormacao,
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        cep: data.cep,
        crea: data.crea,
        cpf: data.cpf,
        rg: data.rg,
        phone: data.phone,
        altPhone: data.altPhone,
        status: data.status,
        banco_nome: data.bank_bank,
        agencia: data.bank_agency,
        conta: data.bank_account,
        chave_pix: data.bank_pix,
        documentos_link: data.documentos_link,
        notes: data.notes,
      }
      if (data.birth_date) payload.birth_date = data.birth_date

      const createdRecord = await pb.collection('users').create(payload)
      onAdd?.(createdRecord as unknown as User)
      toast({ title: 'Sucesso', description: 'Membro adicionado com sucesso.' })
      localStorage.removeItem('memberFormDraft')
      handleOpenChange(false)
    } catch (err: any) {
      if (!window.navigator.onLine || err.status === 0) {
        toast({
          title: 'Conexão perdida',
          description:
            'Não foi possível salvar no servidor. Seus dados estão salvos localmente e você pode tentar novamente mais tarde.',
          variant: 'destructive',
        })
        return
      }

      const errors = extractFieldErrors(err)
      let hasFieldError = false
      Object.entries(errors).forEach(([key, msg]) => {
        if (key in data) {
          form.setError(key as keyof FormValues, { type: 'manual', message: msg as string })
          hasFieldError = true
        }
      })
      if (!hasFieldError)
        toast({
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          setTimeout(() => document.getElementById('member-name')?.focus(), 0)
        }}
      >
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo Membro</DialogTitle>
            <DialogDescription>
              Cadastre um novo profissional preenchendo os dados abaixo.
            </DialogDescription>
          </DialogHeader>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <ScrollArea className="flex-1 px-6">
              <div className="flex flex-col gap-8 py-6">
                {/* 1. Dados Pessoais */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Dados Pessoais</h4>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input
                              id="member-name"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="Ex: João da Silva"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              id="member-cpf"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="000.000.000-00"
                              maxLength={14}
                              {...field}
                              onChange={(e) => handleMaskedChange(e, maskCPF, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              id="member-rg"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="00.000.000-0"
                              maxLength={14}
                              {...field}
                              onChange={(e) => handleMaskedChange(e, maskRG, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input
                              id="member-birth_date"
                              autoComplete="off"
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 2. Dados Profissionais */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Dados Profissionais</h4>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função (Perfil)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger id="member-role" ref={field.ref}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                'Administrador',
                                'Gerente de Projeto',
                                'Projetista',
                                'Estagiário',
                                'Visitante',
                                'Cliente',
                              ].map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger id="member-status" ref={field.ref}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['Ativo', 'Inativo', 'Em Férias', 'Pendente'].map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="formacaoSelect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formação</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger id="member-formacao" ref={field.ref}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                'Engenheiro Civil',
                                'Engenheiro Elétrico',
                                'Engenheiro Mecânico',
                                'Arquiteto',
                                'Topógrafo',
                                'Outros',
                              ].map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormacaoCustomField control={form.control} />
                    <FormField
                      control={form.control}
                      name="crea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registro CREA/CAU</FormLabel>
                          <FormControl>
                            <Input
                              id="member-crea"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="123456/UF"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Provisória</FormLabel>
                          <FormControl>
                            <Input
                              id="member-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Mínimo de 8 caracteres"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código (ID)</FormLabel>
                          <FormControl>
                            <Input
                              id="member-codigo"
                              disabled
                              tabIndex={-1}
                              className="bg-muted font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 3. Contato */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Contato</h4>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              id="member-phone"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="(00) 00000-0000"
                              maxLength={15}
                              {...field}
                              onChange={(e) => handleMaskedChange(e, maskPhone, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="altPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tel. Alternativo</FormLabel>
                          <FormControl>
                            <Input
                              id="member-altPhone"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="(00) 00000-0000"
                              maxLength={15}
                              {...field}
                              onChange={(e) => handleMaskedChange(e, maskPhone, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              id="member-email"
                              type="email"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="contato@exemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 4. Endereço */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Endereço</h4>
                  <Separator />
                  <div className="grid grid-cols-12 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-3">
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              id="member-cep"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="00000-000"
                              maxLength={9}
                              {...field}
                              onChange={(e) =>
                                handleMaskedChange(e, maskCEP, (newVal) => {
                                  field.onChange(newVal)
                                  if (newVal.replace(/\D/g, '').length === 8) {
                                    fetchCep(newVal)
                                  }
                                })
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logradouro"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-7">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input
                              id="member-logradouro"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="Rua, Avenida..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-2">
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input
                              id="member-numero"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="123"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-4">
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input
                              id="member-bairro"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="Centro"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-5">
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              id="member-cidade"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="São Paulo"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-3">
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input
                              id="member-uf"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="SP"
                              maxLength={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 5. Dados Financeiros */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Dados Financeiros</h4>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bank_bank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input
                              id="member-bank_bank"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="Ex: Itaú"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_agency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input
                              id="member-bank_agency"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="0000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Corrente</FormLabel>
                          <FormControl>
                            <Input
                              id="member-bank_account"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="00000-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_pix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave PIX</FormLabel>
                          <FormControl>
                            <Input
                              id="member-bank_pix"
                              autoComplete="off"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              placeholder="CPF, Email..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 6. Outras Informações */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Outras Informações</h4>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            id="member-notes"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            placeholder="Detalhes adicionais..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 7. Documentação */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base text-primary">Documentação</h4>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="documentos_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link da Pasta (Nuvem)</FormLabel>
                        <FormControl>
                          <Input
                            id="member-documentos_link"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            placeholder="https://drive.google.com/..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cole o link da pasta de documentos do profissional.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>
            <SubmitButton
              control={form.control}
              loading={loading}
              onCancel={() => handleOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
