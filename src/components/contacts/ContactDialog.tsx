import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useEffect, useState } from 'react'
import { createContact, updateContact, type Contact } from '@/services/contacts'
import { useToast } from '@/hooks/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/

const formSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  company: z.string().optional(),
  phone: z
    .string()
    .refine((val) => !val || phoneRegex.test(val), 'Formato: (99) 99999-9999')
    .optional(),
  alt_phone: z
    .string()
    .refine((val) => !val || phoneRegex.test(val), 'Formato: (99) 99999-9999')
    .optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
})

type FormValues = z.infer<typeof formSchema>

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  contact?: Contact | null
  existingCategories?: string[]
}

const DEFAULT_CATEGORIES = ['Cliente', 'Fornecedor', 'Parceiro']

export function ContactDialog({
  open,
  onOpenChange,
  onSuccess,
  contact,
  existingCategories = [],
}: ContactDialogProps) {
  const { toast } = useToast()
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchCat, setSearchCat] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      company: '',
      phone: '',
      alt_phone: '',
      email: '',
      address: '',
      notes: '',
      category: 'Cliente',
    },
  })

  useEffect(() => {
    if (open) {
      if (contact) {
        form.reset({
          code: contact.code || '',
          name: contact.name,
          company: contact.company || '',
          phone: contact.phone || '',
          alt_phone: contact.alt_phone || '',
          email: contact.email || '',
          address: contact.address || '',
          notes: contact.notes || '',
          category: contact.category || 'Cliente',
        })
      } else {
        form.reset({
          code: '',
          name: '',
          company: '',
          phone: '',
          alt_phone: '',
          email: '',
          address: '',
          notes: '',
          category: 'Cliente',
        })
      }
      setSearchCat('')
    }
  }, [open, contact, form])

  const onSubmit = async (data: FormValues) => {
    try {
      if (contact) {
        await updateContact(contact.id, data)
        toast({ title: 'Sucesso', description: 'Contato atualizado com sucesso.' })
      } else {
        await createContact(data)
        toast({ title: 'Sucesso', description: 'Contato criado com sucesso.' })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as keyof FormValues, { message: msg })
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar. Verifique se o código já existe.',
          variant: 'destructive',
        })
      }
    }
  }

  const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]))
  const showCreateNew =
    searchCat && !mergedCategories.some((c) => c.toLowerCase() === searchCat.toLowerCase())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          <DialogDescription>
            {contact
              ? 'Modifique os dados do contato abaixo.'
              : 'Preencha os dados do novo contato.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CTT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-1">
                    <FormLabel className="mb-[2px]">Categoria *</FormLabel>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value || 'Selecione...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar ou criar..."
                            onValueChange={setSearchCat}
                            value={searchCat}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {mergedCategories.map((category) => (
                                <CommandItem
                                  value={category}
                                  key={category}
                                  onSelect={() => {
                                    form.setValue('category', category)
                                    setOpenCombobox(false)
                                    setSearchCat('')
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      category === field.value ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {category}
                                </CommandItem>
                              ))}
                              {showCreateNew && (
                                <CommandItem
                                  value={searchCat}
                                  onSelect={() => {
                                    form.setValue('category', searchCat)
                                    setOpenCombobox(false)
                                    setSearchCat('')
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4 opacity-0" />
                                  Criar "{searchCat}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa S.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alt_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Alternativo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o contato..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
