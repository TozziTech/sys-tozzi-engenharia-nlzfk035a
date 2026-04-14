import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileSignature, Printer, FileText, Mail, PenTool } from 'lucide-react'
import { toast } from 'sonner'
import { ContractTemplate, getContractTemplates } from '@/services/contract_templates'
import {
  createGeneratedContract,
  sendContractEmail,
  sendContractForSignature,
} from '@/services/generated_contracts'
import { exportWord } from '@/lib/export'

const formSchema = z.object({
  templateId: z.string().min(1, 'Selecione um modelo'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  clientEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  value: z.string().optional(),
  deadline: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  isCustomEmail: z.boolean().default(false),
})

export default function ContractGenerator() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [isSigning, setIsSigning] = useState(false)

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
    },
  })

  const values = form.watch()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getContractTemplates()
        setTemplates(data)
        if (data.length > 0 && !values.templateId) {
          form.setValue('templateId', data[0].id)
        }
      } catch (err) {
        toast.error('Erro ao carregar modelos de contrato')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTemplates()
  }, [form, values.templateId])

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === values.templateId)
  }, [templates, values.templateId])

  const computeText = (text: string) => {
    if (!text) return ''
    const client = values.clientName || '[NOME_DO_CLIENTE]'
    const address = values.address || '[ENDEREÇO]'
    const val = values.value ? `R$ ${values.value}` : '[VALOR]'
    const deadline = values.deadline ? `${values.deadline} dias` : '[PRAZO]'

    return text
      .replace(/\{\{cliente\}\}/gi, client)
      .replace(/\{\{client_name\}\}/gi, client)
      .replace(/\{\{endereco\}\}/gi, address)
      .replace(/\{\{address\}\}/gi, address)
      .replace(/\{\{valor\}\}/gi, val)
      .replace(/\{\{value\}\}/gi, val)
      .replace(/\{\{prazo\}\}/gi, deadline)
      .replace(/\{\{deadline\}\}/gi, deadline)
      .replace(/\[DATA_DA_ASSINATURA\]/gi, new Date().toLocaleDateString('pt-BR'))
  }

  const computedContent = useMemo(() => {
    if (!selectedTemplate) return 'Selecione um modelo de contrato para visualizar.'
    return computeText(selectedTemplate.content)
  }, [selectedTemplate, values.clientName, values.address, values.value, values.deadline])

  const computedSubject = useMemo(() => {
    const subj = selectedTemplate?.email_subject || 'Contrato de Prestação de Serviços'
    return computeText(subj)
  }, [selectedTemplate, values.clientName, values.address, values.value, values.deadline])

  const computedBody = useMemo(() => {
    const bdy =
      selectedTemplate?.email_body ||
      'Olá {{cliente}},\n\nSegue em anexo o contrato referente aos serviços prestados.\n\nAtenciosamente,'
    return computeText(bdy)
  }, [selectedTemplate, values.clientName, values.address, values.value, values.deadline])

  useEffect(() => {
    if (!values.isCustomEmail) {
      form.setValue('emailSubject', computedSubject)
      form.setValue('emailBody', computedBody)
    }
  }, [computedSubject, computedBody, values.isCustomEmail, form])

  const handlePrint = async () => {
    const isValid = await form.trigger()
    if (!isValid) return
    if (!selectedTemplate) return toast.error('Nenhum modelo selecionado.')

    try {
      toast.loading('Salvando histórico...', { id: 'save-contract' })
      const numValue = values.value
        ? parseFloat(values.value.replace(/\./g, '').replace(',', '.'))
        : 0

      await createGeneratedContract({
        template: selectedTemplate.id,
        client_name: values.clientName,
        client_email: values.clientEmail || '',
        address: values.address || '',
        value: isNaN(numValue) ? 0 : numValue,
        deadline: values.deadline || '',
        final_content: computedContent,
        email_subject: values.emailSubject,
        email_body: values.emailBody,
        status: 'Rascunho',
      })

      toast.success('Contrato salvo no histórico.', { id: 'save-contract' })
      setTimeout(() => {
        window.print()
      }, 500)
    } catch (error) {
      toast.error('Erro ao salvar no histórico.', { id: 'save-contract' })
    }
  }

  const handleExportWord = async () => {
    const isValid = await form.trigger()
    if (!isValid) return
    if (!selectedTemplate) return toast.error('Nenhum modelo selecionado.')

    try {
      toast.loading('Gerando arquivo Word...', { id: 'export-word' })
      const numValue = values.value
        ? parseFloat(values.value.replace(/\./g, '').replace(',', '.'))
        : 0

      await createGeneratedContract({
        template: selectedTemplate.id,
        client_name: values.clientName,
        client_email: values.clientEmail || '',
        address: values.address || '',
        value: isNaN(numValue) ? 0 : numValue,
        deadline: values.deadline || '',
        final_content: computedContent,
        email_subject: values.emailSubject,
        email_body: values.emailBody,
        status: 'Rascunho',
      })

      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      const filename = `Contrato_${values.clientName.replace(/\s+/g, '_')}_${dateStr}.docx`
      exportWord(computedContent, filename)
      toast.success('Contrato exportado e salvo no histórico.', { id: 'export-word' })
    } catch (error) {
      toast.error('Erro ao exportar contrato.', { id: 'export-word' })
    }
  }

  const handleSendEmail = async () => {
    const isValid = await form.trigger()
    if (!isValid) return
    if (!values.clientEmail)
      return form.setError('clientEmail', {
        type: 'manual',
        message: 'E-mail é obrigatório para envio.',
      })
    if (!selectedTemplate) return toast.error('Nenhum modelo selecionado.')

    try {
      toast.loading('Enviando e-mail...', { id: 'send-email' })
      const numValue = values.value
        ? parseFloat(values.value.replace(/\./g, '').replace(',', '.'))
        : 0

      await createGeneratedContract({
        template: selectedTemplate.id,
        client_name: values.clientName,
        client_email: values.clientEmail,
        address: values.address || '',
        value: isNaN(numValue) ? 0 : numValue,
        deadline: values.deadline || '',
        final_content: computedContent,
        email_subject: values.emailSubject,
        email_body: values.emailBody,
        status: 'Rascunho',
      })

      await sendContractEmail(
        values.clientEmail,
        computedContent,
        values.clientName,
        values.emailSubject,
        values.emailBody,
      )

      toast.success('E-mail enviado com sucesso!', { id: 'send-email' })
    } catch (error) {
      toast.error('Erro ao enviar e-mail.', { id: 'send-email' })
    }
  }

  const handleOpenSignatureDialog = async () => {
    const isValid = await form.trigger()
    if (!isValid) return
    if (!values.clientEmail) {
      form.setError('clientEmail', {
        type: 'manual',
        message: 'E-mail é obrigatório para assinatura digital.',
      })
      return
    }
    if (!selectedTemplate) return toast.error('Nenhum modelo selecionado.')

    setIsSignatureDialogOpen(true)
  }

  const confirmSignature = async () => {
    try {
      setIsSigning(true)
      toast.loading('Enviando para assinatura...', { id: 'send-signature' })

      const numValue = values.value
        ? parseFloat(values.value.replace(/\./g, '').replace(',', '.'))
        : 0

      const contract = await createGeneratedContract({
        template: selectedTemplate!.id,
        client_name: values.clientName,
        client_email: values.clientEmail || '',
        address: values.address || '',
        value: isNaN(numValue) ? 0 : numValue,
        deadline: values.deadline || '',
        final_content: computedContent,
        email_subject: values.emailSubject,
        email_body: values.emailBody,
        status: 'Rascunho',
      })

      await sendContractForSignature(contract.id)

      toast.success('Contrato enviado para assinatura com sucesso!', { id: 'send-signature' })
      setIsSignatureDialogOpen(false)
    } catch (error) {
      toast.error('Erro ao enviar para assinatura. Verifique os dados.', { id: 'send-signature' })
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 gap-6">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between print:hidden gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerador de Contratos</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar, assinar e salvar o documento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExportWord}
            disabled={isLoading || templates.length === 0}
            className="gap-2"
          >
            <FileText className="h-4 w-4" /> Exportar Word
          </Button>
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={isLoading || templates.length === 0}
            className="gap-2"
          >
            <Mail className="h-4 w-4" /> Enviar por E-mail
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
            disabled={isLoading || templates.length === 0}
          >
            <Printer className="h-4 w-4" /> Imprimir PDF
          </Button>
          <Button
            onClick={handleOpenSignatureDialog}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || templates.length === 0}
          >
            <PenTool className="h-4 w-4" /> Enviar para Assinatura
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 print:hidden">
        <Card className="flex flex-col border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              Dados do Contrato
            </CardTitle>
            <CardDescription>
              As alterações serão refletidas em tempo real na visualização.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Form {...form}>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Contrato</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading || templates.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={isLoading ? 'Carregando...' : 'Selecione um modelo'}
                            />
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cliente / Razão Social *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: João da Silva ou Empresa XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Cliente</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Ex: cliente@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Obra / Serviço</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Rua das Flores, 123 - Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Projeto (R$)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 15000,00" {...field} />
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
                          <Input type="number" placeholder="Ex: 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Customizar E-mail</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Permite editar o assunto e o corpo do e-mail antes do envio.
                      </p>
                    </div>
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
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <FormField
                        control={form.control}
                        name="emailSubject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto do E-mail</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailBody"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Corpo do E-mail</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[120px] resize-y" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col bg-muted/30 border-none shadow-inner overflow-hidden">
          <CardHeader className="bg-background/50 border-b pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Visualização do Documento
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="bg-white text-black shadow-sm mx-auto max-w-[210mm] min-h-[297mm] p-10 sm:p-16 ring-1 ring-black/5">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed font-normal">
                {computedContent}
              </pre>
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-12 overflow-visible">
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed font-normal max-w-4xl mx-auto">
          {computedContent}
        </pre>
      </div>

      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Assinatura Digital</DialogTitle>
            <DialogDescription>
              O contrato será salvo e um link de assinatura será gerado para o cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Cliente</h4>
              <p className="text-sm text-muted-foreground">{values.clientName}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">E-mail de Destino</h4>
              <p className="text-sm text-muted-foreground">{values.clientEmail}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Assunto do E-mail</h4>
              <p className="text-sm text-muted-foreground">{values.emailSubject}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Mensagem</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap border p-3 rounded-md bg-muted/50">
                {values.emailBody}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSignatureDialogOpen(false)}
              disabled={isSigning}
            >
              Cancelar
            </Button>
            <Button onClick={confirmSignature} disabled={isSigning}>
              {isSigning ? 'Processando...' : 'Confirmar e Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
