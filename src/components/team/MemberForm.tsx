import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
}

const formSchema = z
  .object({
    name: z.string().min(1, 'O nome do membro é obrigatório.'),
    codigo: z.string().trim().min(1, 'O código é obrigatório.'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
    role: z.string().default('Projetista'),
    status: z.string().default('Ativo'),
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
    birthDate: z.string().optional().default(''),
    bank_bank: z.string().optional().default(''),
    bank_agency: z.string().optional().default(''),
    bank_account: z.string().optional().default(''),
    bank_pix: z.string().optional().default(''),
    documentos_link: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (!data.documentos_link) return true
      try {
        new URL(data.documentos_link)
        return true
      } catch {
        return false
      }
    },
    {
      message: 'Insira uma URL válida (ex: https://...).',
      path: ['documentos_link'],
    },
  )
  .refine(
    (data) => {
      if (data.formacaoSelect === 'Outros' && !data.formacaoCustom) return false
      return true
    },
    {
      message: 'Especifique a formação.',
      path: ['formacaoCustom'],
    },
  )
  .refine(
    (data) => {
      if (data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validateCPF(data.cpf)) return false
      return true
    },
    {
      message: 'O CPF informado é inválido.',
      path: ['cpf'],
    },
  )

type FormValues = z.infer<typeof formSchema>

export function MemberForm({ onAdd }: { onAdd: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      birthDate: '',
      bank_bank: '',
      bank_agency: '',
      bank_account: '',
      bank_pix: '',
      documentos_link: '',
    },
  })

  const role = form.watch('role')
  const cepValue = form.watch('cep')
  const formacaoSelectValue = form.watch('formacaoSelect')
  const codigoValue = form.watch('codigo')
  const isCodigoValid = !!codigoValue?.trim()

  const handleMaskedChange = (
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

    window.requestAnimationFrame(() => {
      if (input) {
        let newCursor = 0
        let digitsFound = 0
        for (let i = 0; i < newVal.length; i++) {
          if (/\d/.test(newVal[i])) {
            digitsFound++
          }
          if (digitsFound === unmaskedBeforeCursor.length) {
            newCursor = i + 1
            while (newCursor < newVal.length && !/\d/.test(newVal[newCursor])) {
              newCursor++
            }
            break
          }
        }
        if (unmaskedBeforeCursor.length === 0) newCursor = 0
        input.setSelectionRange(newCursor, newCursor)
      }
    })
  }

  // Handle sequential code generation
  useEffect(() => {
    if (!open) return
    let isMounted = true
    const prefix = ROLE_PREFIXES[role] || 'PER'

    const fetchNextCodigo = async () => {
      try {
        const records = await pb
          .collection('users')
          .getFullList({ filter: `codigo ~ "^${prefix}-"`, fields: 'codigo' })
        let maxNum = 0
        for (const record of records) {
          const match = record.codigo.match(new RegExp(`^${prefix}-(\\d+)`))
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNum) maxNum = num
          }
        }
        const nextNum = maxNum + 1
        if (isMounted) {
          form.setValue('codigo', `${prefix}-${nextNum.toString().padStart(3, '0')}`)
        }
      } catch (e) {
        console.error('Error fetching codigos', e)
      }
    }

    fetchNextCodigo()
    return () => {
      isMounted = false
    }
  }, [open, role, form])

  // Handle CEP auto-fill
  useEffect(() => {
    if (!cepValue) return
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            form.setValue('logradouro', data.logradouro || '')
            form.setValue('bairro', data.bairro || '')
            form.setValue('cidade', data.localidade || '')
            form.setValue('uf', data.uf || '')
          } else {
            toast({ title: 'CEP não encontrado', variant: 'destructive' })
          }
        })
        .catch(() => {
          toast({ title: 'Erro ao buscar CEP', variant: 'destructive' })
        })
    }
  }, [cepValue, form, toast])

  // Handle reset on close
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

    try {
      const existingEmail = await pb
        .collection('users')
        .getList(1, 1, { filter: `email="${data.email.replace(/"/g, '')}"` })
      if (existingEmail.totalItems > 0) {
        form.setError('email', { type: 'manual', message: 'Este e-mail já está cadastrado.' })
        toast({
          title: 'Erro de Validação',
          description: 'Este e-mail já está cadastrado.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const existingCodigo = await pb
        .collection('users')
        .getList(1, 1, { filter: `codigo="${data.codigo.replace(/"/g, '')}"` })
      if (existingCodigo.totalItems > 0) {
        form.setError('codigo', { type: 'manual', message: 'Este código já está em uso.' })
        toast({
          title: 'Erro de Validação',
          description: 'Este código já está em uso.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const createdRecord = await pb.collection('users').create({
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
      })

      const newUser: any = {
        ...createdRecord,
        specialty: finalFormacao,
        address: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.cidade} - ${data.uf}`,
        birthDate: data.birthDate,
        altPhone: data.altPhone,
        status: data.status,
        bankData: {
          bank: data.bank_bank,
          agency: data.bank_agency,
          account: data.bank_account,
          pix: data.bank_pix,
        },
        assignedProjects: [],
      }

      onAdd(newUser as User)
      toast({ title: 'Sucesso', description: 'Membro adicionado à equipe com sucesso.' })
      setOpen(false)
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      let hasFieldError = false

      if (errors.codigo || err.response?.data?.codigo?.code === 'validation_not_unique') {
        form.setError('codigo', { type: 'manual', message: 'Este código já está em uso.' })
        hasFieldError = true
      }
      if (
        errors.email ||
        err.response?.data?.email?.code === 'validation_invalid_email' ||
        err.response?.data?.email?.code === 'validation_not_unique'
      ) {
        form.setError('email', {
          type: 'manual',
          message: 'Este e-mail já está cadastrado ou é inválido.',
        })
        hasFieldError = true
      }

      for (const [key, msg] of Object.entries(errors)) {
        if (key !== 'codigo' && key !== 'email' && key in data) {
          form.setError(key as keyof FormValues, { type: 'manual', message: msg as string })
          hasFieldError = true
        }
      }

      if (!hasFieldError || errors.codigo || errors.email) {
        const errorMsg = getErrorMessage(err)
        const isDuplicate =
          err.status === 400 &&
          (errors.codigo ||
            errors.email ||
            errorMsg.toLowerCase().includes('failed to create') ||
            errorMsg.toLowerCase().includes('validation'))

        toast({
          title: 'Erro ao salvar',
          description: isDuplicate
            ? 'Verifique os dados: Este e-mail ou código já está em uso.'
            : errorMsg,
          variant: 'destructive',
        })
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
      <DialogContent className="sm:max-w-[750px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo Membro</DialogTitle>
            <DialogDescription>
              Cadastre um novo profissional na equipe do sistema.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <ScrollArea className="flex-1 px-6">
              <div className="flex flex-col gap-8 py-4 pb-6">
                {/* Section: Dados Pessoais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-semibold text-base text-primary">Dados Pessoais</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: João da Silva" {...field} />
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
                          <FormLabel>
                            Código (ID) <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Automático"
                              disabled
                              className="bg-muted text-muted-foreground font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Gerado automaticamente com base no cargo.
                          </FormDescription>
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
                            <Input type="email" placeholder="contato@exemplo.com" {...field} />
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
                              type="password"
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
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo / Acesso</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Administrador">Administrador</SelectItem>
                              <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                              <SelectItem value="Projetista">Projetista</SelectItem>
                              <SelectItem value="Estagiário">Estagiário</SelectItem>
                              <SelectItem value="Visitante">Visitante</SelectItem>
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
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Ativo">Ativo</SelectItem>
                              <SelectItem value="Inativo">Inativo</SelectItem>
                              <SelectItem value="Em Férias">Em Férias</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
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
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
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
                          <FormLabel>Telefone Alternativo</FormLabel>
                          <FormControl>
                            <Input
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
                  </div>
                </div>

                {/* Section: Endereço */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-semibold text-base text-primary">Endereço</h4>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-4">
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
                              maxLength={9}
                              {...field}
                              onChange={(e) =>
                                handleMaskedChange(
                                  e,
                                  (val) =>
                                    val
                                      .replace(/\D/g, '')
                                      .replace(/^(\d{5})(\d)/, '$1-$2')
                                      .slice(0, 9),
                                  field.onChange,
                                )
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
                        <FormItem className="col-span-12 sm:col-span-8">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-3">
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
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
                            <Input placeholder="Centro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-3">
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-2">
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section: Dados Profissionais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-semibold text-base text-primary">Dados Profissionais</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="formacaoSelect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formação</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                              <SelectItem value="Engenheiro Elétrico">
                                Engenheiro Elétrico
                              </SelectItem>
                              <SelectItem value="Engenheiro Mecânico">
                                Engenheiro Mecânico
                              </SelectItem>
                              <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                              <SelectItem value="Topógrafo">Topógrafo</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {formacaoSelectValue === 'Outros' && (
                      <FormField
                        control={form.control}
                        name="formacaoCustom"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in zoom-in duration-200">
                            <FormLabel>Especifique a Formação</FormLabel>
                            <FormControl>
                              <Input placeholder="Sua formação..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="crea"
                      render={({ field }) => (
                        <FormItem className={formacaoSelectValue !== 'Outros' ? 'col-span-1' : ''}>
                          <FormLabel>Registro CREA/CAU</FormLabel>
                          <FormControl>
                            <Input placeholder="123456/UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section: Dados Financeiros */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-semibold text-base text-primary">Dados Financeiros</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bank_bank"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Itaú, Nubank" {...field} />
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
                            <Input placeholder="0000" {...field} />
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
                            <Input placeholder="00000-0" {...field} />
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
                            <Input placeholder="CPF, Email ou Celular" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section: Documentação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-semibold text-base text-primary">Documentação</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="documentos_link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link da Pasta na Nuvem Documentos</FormLabel>
                          <FormControl>
                            <Input placeholder="https://drive.google.com/..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Cole o link da pasta contendo contratos, certificados e documentos do
                            profissional.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t border-border/50 bg-muted/10">
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !isCodigoValid}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Membro
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
