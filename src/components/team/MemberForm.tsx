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

const formSchema = z
  .object({
    name: z.string().min(1, 'O nome do membro é obrigatório.'),
    codigo: z.string().min(1, 'O código é obrigatório.'),
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
  })
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
    },
  })

  useEffect(() => {
    if (open) {
      const fetchNextCodigo = async () => {
        try {
          const records = await pb
            .collection('users')
            .getFullList({ filter: 'codigo ~ "PER-"', fields: 'codigo' })
          let maxNum = 0
          for (const record of records) {
            const match = record.codigo.match(/PER-(\d+)/)
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNum) maxNum = num
            }
          }
          const nextNum = maxNum + 1
          form.setValue('codigo', `PER-${nextNum.toString().padStart(3, '0')}`)
        } catch (e) {
          console.error('Error fetching codigos', e)
        }
      }
      if (!form.getValues('codigo')) fetchNextCodigo()
    } else {
      form.reset()
    }
  }, [open, form])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

    try {
      const createdRecord = await pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        name: data.name,
        codigo: data.codigo,
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
        status: data.status,
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

      if (!hasFieldError) {
        toast({
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const formacaoSelectValue = form.watch('formacaoSelect')

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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <ScrollArea className="flex-1 px-6">
              <div className="grid gap-6 py-4 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
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
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Código (ID)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: PER-001"
                            disabled
                            className="bg-muted text-muted-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="col-span-3 sm:col-span-1">
                        <FormLabel>Cargo</FormLabel>
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
                      <FormItem className="col-span-3 sm:col-span-1">
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
                  <FormField
                    control={form.control}
                    name="crea"
                    render={({ field }) => (
                      <FormItem className="col-span-3 sm:col-span-1">
                        <FormLabel>CREA</FormLabel>
                        <FormControl>
                          <Input placeholder="123456/UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formacaoSelect"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
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
                            <SelectItem value="Engenheiro Elétrico">Engenheiro Elétrico</SelectItem>
                            <SelectItem value="Engenheiro Mecânico">Engenheiro Mecânico</SelectItem>
                            <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                            <SelectItem value="Topógrafo">Topógrafo</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {formacaoSelectValue === 'Outros' ? (
                    <FormField
                      control={form.control}
                      name="formacaoCustom"
                      render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1 animate-in fade-in zoom-in duration-200">
                          <FormLabel>Especifique a Formação</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua formação..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="hidden sm:block col-span-1"></div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
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
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Senha Provisória</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo de 8 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            {...field}
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
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
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Telefone Alternativo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            {...field}
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-2 pt-6 border-t border-border/50">
                  <h4 className="font-semibold text-sm mb-4">Endereço</h4>
                  <div className="grid grid-cols-12 gap-4">
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
                        <FormItem className="col-span-12 sm:col-span-4">
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
                        <FormItem className="col-span-12 sm:col-span-5">
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
                        <FormItem className="col-span-12 sm:col-span-4">
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
                        <FormItem className="col-span-12 sm:col-span-3">
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem className="col-span-12 sm:col-span-4">
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 pt-6 border-t border-border/50">
                  <h4 className="font-semibold text-sm mb-4">Dados Pessoais</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              maxLength={14}
                              {...field}
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
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
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000-0"
                              maxLength={12}
                              {...field}
                              onChange={(e) => field.onChange(maskRG(e.target.value))}
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
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 pt-6 border-t border-border/50">
                  <h4 className="font-semibold text-sm mb-4">Dados Bancários</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bank_bank"
                      render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
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
                        <FormItem className="col-span-2 sm:col-span-1">
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
                        <FormItem className="col-span-2 sm:col-span-1">
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
                        <FormItem className="col-span-2 sm:col-span-1">
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
                <Button type="submit" disabled={loading}>
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
