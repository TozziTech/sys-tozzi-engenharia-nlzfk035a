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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileSignature, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { ContractTemplate, getContractTemplates } from '@/services/contract_templates'
import { createGeneratedContract } from '@/services/generated_contracts'

const formSchema = z.object({
  templateId: z.string().min(1, 'Selecione um modelo'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  address: z.string().optional(),
  value: z.string().optional(),
  deadline: z.string().optional(),
})

export default function ContractGenerator() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateId: '',
      clientName: '',
      address: '',
      value: '',
      deadline: '',
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

  const computedContent = useMemo(() => {
    if (!selectedTemplate) return 'Selecione um modelo de contrato para visualizar.'

    let text = selectedTemplate.content
    const client = values.clientName || '[NOME_DO_CLIENTE]'
    const address = values.address || '[ENDEREÇO]'
    const value = values.value ? `R$ ${values.value}` : '[VALOR]'
    const deadline = values.deadline ? `${values.deadline} dias` : '[PRAZO]'

    text = text.replace(/\{\{cliente\}\}/gi, client)
    text = text.replace(/\{\{endereco\}\}/gi, address)
    text = text.replace(/\{\{valor\}\}/gi, value)
    text = text.replace(/\{\{prazo\}\}/gi, deadline)

    // Auto-replace common static tags if any
    const dateStr = new Date().toLocaleDateString('pt-BR')
    text = text.replace(/\[DATA_DA_ASSINATURA\]/gi, dateStr)

    return text
  }, [selectedTemplate, values])

  const handlePrint = async () => {
    const isValid = await form.trigger()
    if (!isValid) return

    if (!selectedTemplate) {
      toast.error('Nenhum modelo selecionado.')
      return
    }

    try {
      toast.loading('Salvando histórico...', { id: 'save-contract' })

      const numValue = values.value
        ? parseFloat(values.value.replace(/\./g, '').replace(',', '.'))
        : 0

      await createGeneratedContract({
        template: selectedTemplate.id,
        client_name: values.clientName,
        address: values.address || '',
        value: isNaN(numValue) ? 0 : numValue,
        deadline: values.deadline || '',
        final_content: computedContent,
      })

      toast.success('Contrato salvo no histórico.', { id: 'save-contract' })

      // Delay slightly so the toast is visible before the print dialog freezes the thread
      setTimeout(() => {
        window.print()
      }, 500)
    } catch (error) {
      toast.error('Erro ao salvar no histórico.', { id: 'save-contract' })
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerador de Contratos</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar e salvar o documento.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          className="gap-2"
          disabled={isLoading || templates.length === 0}
        >
          <Printer className="h-4 w-4" />
          Salvar e Imprimir PDF
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0 print:hidden">
        {/* Formulário */}
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview */}
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

      {/* Área de Impressão */}
      <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-12 overflow-visible">
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed font-normal max-w-4xl mx-auto">
          {computedContent}
        </pre>
      </div>
    </div>
  )
}
