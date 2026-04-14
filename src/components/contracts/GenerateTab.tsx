import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PenTool, Save, X, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { ContractTemplate, getContractTemplates } from '@/services/contract_templates'
import { createGeneratedContract, sendContractForSignature } from '@/services/generated_contracts'
import { Client, getClients } from '@/services/clients'
import { useRealtime } from '@/hooks/use-realtime'
import { ContractPreview } from './ContractPreview'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Label } from '@/components/ui/label'

const formSchema = z.object({
  templateId: z.string().min(1, 'Selecione um modelo'),
  clientName: z.string().min(1, 'Obrigatório'),
  clientEmail: z.string().email('Inválido').optional().or(z.literal('')),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  value: z.string().optional(),
  deadline: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  isCustomEmail: z.boolean().default(false),
  isCustomContent: z.boolean().default(false),
  customContent: z.string().optional(),
})

export function GenerateTab({ editingContract, onClearEdit, onTabChange }: any) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateId: '',
      clientName: '',
      clientEmail: '',
      address: '',
      value: '',
      deadline: '',
      emailSubject: '',
      emailBody: '',
      isCustomEmail: false,
      isCustomContent: false,
      customContent: '',
    },
  })
  const values = form.watch()

  useEffect(() => {
    getContractTemplates().then((data) => {
      setTemplates(data)
      if (data.length > 0 && !editingContract) form.setValue('templateId', data[0].id)
    })
    getClients().then(setClients)
  }, [editingContract, form])

  useRealtime('contract_templates', () => {
    getContractTemplates().then(setTemplates)
  })

  useRealtime('clients', () => {
    getClients().then(setClients)
  })

  useEffect(() => {
    if (editingContract) {
      form.reset({
        templateId: editingContract.template,
        clientName: editingContract.client_name,
        clientEmail: editingContract.client_email || '',
        address: editingContract.address || '',
        cpfCnpj: '',
        value: editingContract.value?.toString() || '',
        deadline: editingContract.deadline || '',
        emailSubject: editingContract.email_subject || '',
        emailBody: editingContract.email_body || '',
        isCustomEmail: true,
        isCustomContent: true,
        customContent: editingContract.final_content || '',
      })
    }
  }, [editingContract, form])

  useEffect(() => {
    if (editingContract && clients.length > 0) {
      const matched = clients.find((c) => c.name === editingContract.client_name)
      if (matched && !form.getValues('cpfCnpj')) {
        form.setValue('cpfCnpj', matched.cnpj_cpf || '')
      }
    }
  }, [editingContract, clients, form])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === values.templateId),
    [templates, values.templateId],
  )

  const computeText = (text: string) => {
    if (!text) return ''
    const val = values.value ? `R$ ${values.value}` : '[VALOR]'
    const deadline = values.deadline ? `${values.deadline} dias` : '[PRAZO]'
    return text
      .replace(/\{\{cliente\}\}/gi, values.clientName || '[CLIENTE]')
      .replace(/\{\{endereco\}\}/gi, values.address || '[ENDEREÇO]')
      .replace(/\{\{documento\}\}/gi, values.cpfCnpj || '[DOCUMENTO]')
      .replace(/\{\{cpf_cnpj\}\}/gi, values.cpfCnpj || '[DOCUMENTO]')
      .replace(/\{\{valor\}\}/gi, val)
      .replace(/\{\{prazo\}\}/gi, deadline)
      .replace(/\[DATA_DA_ASSINATURA\]/gi, new Date().toLocaleDateString('pt-BR'))
  }

  const computedContent = useMemo(
    () => computeText(selectedTemplate?.content || 'Selecione um modelo.'),
    [
      selectedTemplate,
      values.clientName,
      values.address,
      values.cpfCnpj,
      values.value,
      values.deadline,
    ],
  )
  const computedSubject = useMemo(
    () => computeText(selectedTemplate?.email_subject || 'Contrato'),
    [
      selectedTemplate,
      values.clientName,
      values.address,
      values.cpfCnpj,
      values.value,
      values.deadline,
    ],
  )
  const computedBody = useMemo(
    () => computeText(selectedTemplate?.email_body || 'Olá, segue anexo.'),
    [
      selectedTemplate,
      values.clientName,
      values.address,
      values.cpfCnpj,
      values.value,
      values.deadline,
    ],
  )

  useEffect(() => {
    if (!values.isCustomEmail && !editingContract) {
      form.setValue('emailSubject', computedSubject)
      form.setValue('emailBody', computedBody)
    }
  }, [computedSubject, computedBody, values.isCustomEmail, editingContract, form])

  const finalDocumentContent = values.isCustomContent ? values.customContent || '' : computedContent

  const prepareData = (status: string) => ({
    template: selectedTemplate!.id,
    client_name: values.clientName,
    client_email: values.clientEmail || '',
    address: values.address || '',
    value: values.value ? parseFloat(values.value.replace(/\./g, '').replace(',', '.')) : 0,
    deadline: values.deadline || '',
    final_content: finalDocumentContent,
    email_subject: values.emailSubject,
    email_body: values.emailBody,
    status,
  })

  const handleAction = async (isSend: boolean) => {
    if (!(await form.trigger()) || !selectedTemplate) return
    if (isSend && !values.clientEmail)
      return form.setError('clientEmail', { type: 'manual', message: 'Obrigatório para envio' })

    try {
      setIsProcessing(true)
      toast.loading(isSend ? 'Enviando...' : 'Salvando...', { id: 'action' })
      const data = prepareData('Rascunho')

      let cid = editingContract?.id
      if (cid) await pb.collection('generated_contracts').update(cid, data)
      else cid = (await createGeneratedContract(data)).id

      if (isSend) await sendContractForSignature(cid)

      toast.success(isSend ? 'Enviado!' : 'Salvo!', { id: 'action' })
      onClearEdit()
      form.reset()
      onTabChange('history')
    } catch {
      toast.error('Erro na operação', { id: 'action' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full min-h-0">
      <Card className="flex flex-col border-none shadow-md overflow-hidden">
        <CardContent className="flex-1 overflow-auto p-6 space-y-4">
          <Form {...form}>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {editingContract && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md flex justify-between items-center text-sm mb-4">
                  <span>
                    Editando rascunho de: <b>{editingContract.client_name}</b>
                  </span>
                  <Button variant="ghost" size="sm" onClick={onClearEdit}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                </div>
              )}
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Cliente *</FormLabel>
                      <div className="relative flex w-full items-center">
                        <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={clientSearchOpen}
                                className={cn(
                                  'w-full justify-between font-normal pr-12',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                <span className="truncate">
                                  {field.value || 'Selecione ou digite...'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 absolute right-3" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Buscar cliente..."
                                value={clientSearchQuery}
                                onValueChange={setClientSearchQuery}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start px-2 py-1.5 text-sm font-normal text-left"
                                    onClick={() => {
                                      form.setValue('clientName', clientSearchQuery)
                                      form.setValue('clientEmail', '')
                                      form.setValue('address', '')
                                      form.setValue('cpfCnpj', '')
                                      setClientSearchOpen(false)
                                    }}
                                  >
                                    Usar "{clientSearchQuery}"
                                  </Button>
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.name}
                                      onSelect={(currentValue) => {
                                        const selected = clients.find(
                                          (c) =>
                                            c.name.toLowerCase() === currentValue.toLowerCase(),
                                        )
                                        if (selected) {
                                          form.setValue('clientName', selected.name)
                                          form.setValue('clientEmail', selected.email || '')
                                          form.setValue('address', selected.address || '')
                                          form.setValue('cpfCnpj', selected.cnpj_cpf || '')
                                        } else {
                                          form.setValue('clientName', currentValue)
                                          form.setValue('clientEmail', '')
                                          form.setValue('address', '')
                                          form.setValue('cpfCnpj', '')
                                        }
                                        setClientSearchOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          client.name === field.value ? 'opacity-100' : 'opacity-0',
                                        )}
                                      />
                                      {client.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-8 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              form.setValue('clientName', '')
                              form.setValue('clientEmail', '')
                              form.setValue('address', '')
                              form.setValue('cpfCnpj', '')
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpfCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo (dias)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Customizar E-mail</FormLabel>
                  <FormField
                    control={form.control}
                    name="isCustomEmail"
                    render={({ field }) => (
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    )}
                  />
                </div>
                {values.isCustomEmail && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <FormField
                      control={form.control}
                      name="emailSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assunto</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emailBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleAction(false)}
                  disabled={isProcessing}
                >
                  <Save className="h-4 w-4 mr-2" /> Salvar Rascunho
                </Button>
                <Button
                  onClick={() => handleAction(true)}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PenTool className="h-4 w-4 mr-2" /> Enviar para Assinatura
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="flex flex-col bg-muted/30 border-none shadow-inner overflow-hidden relative min-h-[400px]">
        <div className="absolute top-0 left-0 w-full p-2 bg-background/80 backdrop-blur z-10 border-b flex justify-between items-center pr-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase pl-2">
            Visualização do Documento
          </span>
          <div className="flex items-center gap-2">
            <Label htmlFor="custom-content" className="text-xs cursor-pointer font-medium">
              Editar Manualmente
            </Label>
            <Switch
              id="custom-content"
              checked={values.isCustomContent}
              onCheckedChange={(c) => {
                form.setValue('isCustomContent', c)
                if (c) {
                  form.setValue('customContent', computedContent)
                }
              }}
            />
          </div>
        </div>
        <div className="flex-1 mt-10 overflow-hidden flex flex-col">
          {values.isCustomContent ? (
            <div className="flex-1 p-2 h-full flex flex-col">
              <RichTextEditor
                className="h-full bg-white text-black ring-1 ring-black/5"
                value={values.customContent || ''}
                onChange={(val) => form.setValue('customContent', val)}
              />
            </div>
          ) : (
            <ContractPreview content={computedContent} clientName={values.clientName} />
          )}
        </div>
      </Card>
    </div>
  )
}
