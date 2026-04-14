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

const formSchema = z.object({
  template: z.string().min(1, 'Selecione um modelo'),
  clientName: z.string().optional(),
  address: z.string().optional(),
  value: z.string().optional(),
  deadline: z.string().optional(),
})

const templates = [
  { id: 'prestacao-servico', name: 'Prestação de Serviço de Engenharia' },
  { id: 'consultoria', name: 'Consultoria Técnica' },
]

export default function ContractGenerator() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: 'prestacao-servico',
      clientName: '',
      address: '',
      value: '',
      deadline: '',
    },
  })

  const values = form.watch()

  const getTemplateContent = () => {
    const client = values.clientName || '[NOME_DO_CLIENTE]'
    const address = values.address || '[ENDERECO]'
    const value = values.value ? `R$ ${values.value}` : '[VALOR]'
    const deadline = values.deadline ? `${values.deadline} dias` : '[PRAZO]'
    const date = new Date().toLocaleDateString('pt-BR')

    if (values.template === 'consultoria') {
      return `CONTRATO DE CONSULTORIA TÉCNICA

Pelo presente instrumento particular, de um lado, TOZZI ENGENHARIA, doravante denominada CONTRATADA, inscrita no CNPJ sob o nº 00.000.000/0001-00, e de outro lado ${client}, doravante denominado(a) CONTRATANTE.

1. OBJETO
O presente contrato tem como objeto a prestação de serviços de consultoria técnica de engenharia no endereço: ${address}.

2. VALOR E CONDIÇÕES DE PAGAMENTO
Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de ${value}. O pagamento será realizado conforme condições acordadas previamente entre as partes.

3. PRAZO
Os serviços serão executados no prazo de ${deadline}, contados a partir da assinatura deste instrumento. A prorrogação deste prazo poderá ocorrer mediante aditivo contratual.

4. FORO
As partes elegem o foro da comarca atual para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.

E, por estarem justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma.

Data: ${date}

_____________________________________________________
TOZZI ENGENHARIA - CONTRATADA

_____________________________________________________
${client} - CONTRATANTE`
    }

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ENGENHARIA

Pelo presente instrumento particular, de um lado, TOZZI ENGENHARIA, doravante denominada CONTRATADA, inscrita no CNPJ sob o nº 00.000.000/0001-00, e de outro lado ${client}, doravante denominado(a) CONTRATANTE.

1. OBJETO
O presente contrato tem como objeto a execução de obras e/ou elaboração de projetos de engenharia no seguinte local: ${address}.

2. REMUNERAÇÃO
Pela execução dos serviços objeto deste contrato, a CONTRATANTE obriga-se a pagar à CONTRATADA o valor de ${value}, conforme cronograma físico-financeiro anexo.

3. PRAZO DE EXECUÇÃO
A CONTRATADA compromete-se a concluir a obra/projeto no prazo de ${deadline}, contados da data de emissão da Ordem de Serviço ou assinatura deste.

4. RESPONSABILIDADES
A CONTRATADA assume total responsabilidade técnica pela execução dos serviços, comprometendo-se a observar as normas da ABNT e fornecer a respectiva ART (Anotação de Responsabilidade Técnica).

E, por estarem justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma.

Data: ${date}

_____________________________________________________
TOZZI ENGENHARIA - CONTRATADA

_____________________________________________________
${client} - CONTRATANTE`
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerador de Contratos</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar e exportar o documento.
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Gerar PDF
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
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Contrato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
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
                      <FormLabel>Nome do Cliente / Razão Social</FormLabel>
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
                          <Input placeholder="Ex: 15.000,00" {...field} />
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
                {getTemplateContent()}
              </pre>
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Área de Impressão (invisível em tela, visível na impressão) */}
      <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-12 overflow-visible">
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed font-normal max-w-4xl mx-auto">
          {getTemplateContent()}
        </pre>
      </div>
    </div>
  )
}
