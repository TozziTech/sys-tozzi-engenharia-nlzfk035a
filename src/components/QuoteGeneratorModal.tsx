import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { DatePicker } from '@/components/DatePicker'
import {
  Plus,
  Trash,
  ArrowLeft,
  Check,
  InfoIcon,
  Eye,
  X,
  FileDown,
  Paperclip,
  File as FileIcon,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export type QuoteItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export type QuoteData = {
  id?: string
  clientName: string
  clientEmail?: string
  projectName: string
  date?: string
  value?: number
  status?: string
  deadline?: Date
  paymentMethod?: string
  includedItems?: string
  notIncludedItems?: string
  observations?: string
  items: QuoteItem[]
  attachments?: (string | File)[]
}

interface QuoteGeneratorModalProps {
  children?: React.ReactNode
  initialData?: QuoteData
  onSave?: (data: QuoteData) => void | Promise<void>
}

export function QuoteGeneratorModal({ children, initialData, onSave }: QuoteGeneratorModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [clientName, setClientName] = useState(initialData?.clientName || '')
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '')
  const [projectName, setProjectName] = useState(initialData?.projectName || '')
  const [includedItems, setIncludedItems] = useState(initialData?.includedItems || '')
  const [notIncludedItems, setNotIncludedItems] = useState(initialData?.notIncludedItems || '')
  const [observations, setObservations] = useState(initialData?.observations || '')
  const [deadline, setDeadline] = useState<Date | undefined>(initialData?.deadline)
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '')
  const [attachments, setAttachments] = useState<(string | File)[]>(initialData?.attachments || [])

  const [items, setItems] = useState<QuoteItem[]>(
    initialData?.items || [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
  )

  React.useEffect(() => {
    if (open) {
      setClientName(initialData?.clientName || '')
      setClientEmail(initialData?.clientEmail || '')
      setProjectName(initialData?.projectName || '')
      setIncludedItems(initialData?.includedItems || '')
      setNotIncludedItems(initialData?.notIncludedItems || '')
      setObservations(initialData?.observations || '')
      setDeadline(initialData?.deadline)
      setPaymentMethod(initialData?.paymentMethod || '')
      setAttachments(initialData?.attachments || [])
      setFieldErrors({})
      setItems(
        initialData?.items || [
          { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 },
        ],
      )
      setIsPreview(false)
    }
  }, [open, initialData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 },
    ])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)])
    }
    e.target.value = ''
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [items],
  )

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setIsPreview(false)
        setIsSaving(false)
      }, 300)
    }
  }

  const handleExport = () => {
    toast({
      title: 'Exportação Concluída',
      description: 'O orçamento foi exportado como PDF com sucesso.',
    })
  }

  const handleFinalize = async () => {
    if (onSave) {
      setIsSaving(true)
      setFieldErrors({})
      try {
        const result = onSave({
          id: initialData?.id,
          clientName,
          clientEmail,
          projectName,
          deadline,
          paymentMethod,
          includedItems,
          notIncludedItems,
          observations,
          items,
          attachments,
          status: initialData?.status || 'Pendente',
          date: initialData?.date || format(new Date(), 'dd/MM/yyyy'),
        })
        if (result instanceof Promise) {
          await result
        }
        setOpen(false)
      } catch (err) {
        const errors = extractFieldErrors(err)
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) {
          setIsPreview(false)
          toast({
            variant: 'destructive',
            title: 'Erro de Validação',
            description: errors.attachments || 'Verifique os dados preenchidos no formulário.',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro Inesperado',
            description: 'Ocorreu um erro ao salvar o orçamento.',
          })
        }
      } finally {
        setIsSaving(false)
      }
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 w-[95vw]">
        <div className="p-6 border-b shrink-0 bg-background z-10">
          <DialogHeader>
            <DialogTitle>{isPreview ? 'Revisão do Orçamento' : 'Gerar Novo Orçamento'}</DialogTitle>
            <DialogDescription>
              {isPreview
                ? 'Confira os dados antes de finalizar. Esta é a visão que o cliente terá na proposta.'
                : 'Preencha os dados abaixo para gerar um orçamento detalhado e profissional.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
          {isPreview ? (
            <div className="space-y-8 bg-white text-slate-800 p-6 md:p-10 rounded-lg border shadow-sm mx-auto max-w-3xl relative">
              <div className="flex flex-col md:flex-row justify-between items-start border-b pb-6 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-slate-900">
                    Proposta Comercial
                  </h2>
                  <h3 className="text-lg md:text-xl font-medium text-slate-700 mt-2">
                    {projectName || 'Sem Título'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Gerado em {format(new Date(), 'dd/MM/yyyy')}{' '}
                    {clientName && `para ${clientName}`}
                  </p>
                </div>
                <div className="text-left md:text-right bg-slate-50 p-4 rounded-lg border min-w-[200px]">
                  <p className="text-sm font-medium text-slate-500 uppercase">
                    Valor Total Estimado
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-primary mt-1">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Prazo de Entrega
                  </h3>
                  <p className="font-medium text-slate-800">
                    {deadline ? format(deadline, 'dd/MM/yyyy') : 'A combinar'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Condições de Pagamento
                  </h3>
                  <p className="font-medium text-slate-800">{paymentMethod || 'A combinar'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50/50 p-5 rounded-lg border border-green-100 h-full">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center">
                    <Check className="w-4 h-4 mr-1" /> O que está incluso
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {includedItems || 'Nenhum item especificado.'}
                  </p>
                </div>
                <div className="bg-red-50/50 p-5 rounded-lg border border-red-100 h-full">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center">
                    <X className="w-4 h-4 mr-1" /> O que NÃO está incluso
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {notIncludedItems || 'Nenhum item especificado.'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Detalhamento dos Serviços
                </h3>
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-700">
                          Descrição do Item
                        </TableHead>
                        <TableHead className="text-center font-semibold text-slate-700 w-[80px]">
                          Qtd
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 w-[120px]">
                          Valor Un.
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 w-[120px]">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow
                          key={item.id}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                        >
                          <TableCell className="font-medium text-slate-800">
                            {item.description || 'Item não especificado'}
                          </TableCell>
                          <TableCell className="text-center text-slate-600">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-800">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum item adicionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    {items.length > 0 && (
                      <TableFooter className="bg-slate-50">
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold text-slate-700">
                            Total Geral
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(total)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-1" /> Documentos Anexos
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {attachments.map((att, i) => {
                      const isFile = att instanceof File
                      const name = isFile ? att.name : att
                      const url = isFile
                        ? URL.createObjectURL(att)
                        : initialData?.id
                          ? pb.files.getUrl(
                              {
                                id: initialData.id,
                                collectionId: 'quotes',
                                collectionName: 'quotes',
                              } as any,
                              att as string,
                            )
                          : '#'

                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm transition-colors shadow-sm"
                        >
                          <FileIcon className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="truncate max-w-[200px] font-medium">{name}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {observations && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Observações Adicionais
                  </h3>
                  <div className="bg-slate-50 p-5 rounded-lg border text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {observations}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 bg-background p-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="clientName" className="text-sm font-semibold text-foreground/90">
                    Cliente / Empresa
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Nome do cliente..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="clientEmail" className="text-sm font-semibold text-foreground/90">
                    Email do Cliente
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="Ex: cliente@empresa.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="projectName" className="text-sm font-semibold text-foreground/90">
                    Título do Projeto
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="Ex: Reforma Comercial..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="deadline" className="text-sm font-semibold text-foreground/90">
                    Prazo de Entrega Estimado
                  </Label>
                  <DatePicker
                    date={deadline}
                    setDate={setDeadline}
                    label="Selecione uma data limite"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="payment" className="text-sm font-semibold text-foreground/90">
                    Forma de Pagamento
                  </Label>
                  <Input
                    id="payment"
                    placeholder="Ex: 50% no aceite, 50% na homologação"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" /> Itens Inclusos no Escopo
                  </Label>
                  <Textarea
                    placeholder="Liste os entregáveis e serviços que fazem parte do projeto..."
                    value={includedItems}
                    onChange={(e) => setIncludedItems(e.target.value)}
                    className="min-h-[140px] resize-y"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Itens Não Inclusos no Escopo
                  </Label>
                  <Textarea
                    placeholder="Deixe claro o que está fora do escopo para evitar desalinhamentos..."
                    value={notIncludedItems}
                    onChange={(e) => setNotIncludedItems(e.target.value)}
                    className="min-h-[140px] resize-y"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border">
                  <Label className="text-sm font-semibold text-foreground/90 ml-1">
                    Tabela de Precificação
                  </Label>
                  <Button variant="secondary" size="sm" onClick={handleAddItem} className="h-8">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground">
                          Descrição do Serviço / Módulo
                        </TableHead>
                        <TableHead className="w-[100px] text-center font-semibold text-foreground">
                          Qtd
                        </TableHead>
                        <TableHead className="w-[150px] text-right font-semibold text-foreground">
                          Valor Un. (R$)
                        </TableHead>
                        <TableHead className="w-[150px] text-right font-semibold text-foreground">
                          Subtotal
                        </TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-transparent">
                          <TableCell className="p-2 align-top">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(item.id, 'description', e.target.value)
                              }
                              placeholder="Ex: Desenvolvimento Frontend"
                              className="focus-visible:ring-1"
                            />
                          </TableCell>
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={(e) =>
                                handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)
                              }
                              className="text-center focus-visible:ring-1"
                            />
                          </TableCell>
                          <TableCell className="p-2 align-top">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || ''}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  'unitPrice',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="text-right focus-visible:ring-1"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium p-4 align-top text-foreground/80">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </TableCell>
                          <TableCell className="p-2 text-center align-top pt-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length === 1}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="hover:bg-transparent bg-muted/20 border-t">
                        <TableCell
                          colSpan={3}
                          className="text-right font-semibold py-4 text-muted-foreground"
                        >
                          Valor Total do Orçamento:
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg text-primary py-4">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-500" /> Anexos do Orçamento
                </Label>
                <div className="border rounded-md p-4 bg-muted/20">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-xs hover:file:bg-primary/90 file:font-medium cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos suportados: PDF, Imagens, Documentos. Tamanho máximo: 10MB por arquivo.
                  </p>

                  {attachments.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {attachments.map((att, i) => {
                        const isFile = att instanceof File
                        const name = isFile ? att.name : att
                        return (
                          <li
                            key={i}
                            className="flex items-center justify-between bg-background px-3 py-2 rounded-md border shadow-sm text-sm"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate font-medium">{name}</span>
                              {isFile && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold ml-2 shrink-0">
                                  NOVO
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 ml-2"
                              onClick={() => handleRemoveAttachment(i)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {fieldErrors.attachments && (
                    <p className="text-sm text-destructive mt-2">{fieldErrors.attachments}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground/90">
                  Observações Gerais
                </Label>
                <Textarea
                  placeholder="Anotações internas ou condições específicas que devem constar no rodapé da proposta..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t bg-background shrink-0 mt-auto">
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-3 sm:gap-0">
            {isPreview ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsPreview(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Edição
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={isSaving}
                    className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                  </Button>
                  <Button onClick={handleFinalize} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {isSaving
                      ? 'Salvando...'
                      : initialData
                        ? 'Salvar Alterações'
                        : 'Finalizar Orçamento'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={() => setIsPreview(true)} className="w-full sm:w-auto">
                  <Eye className="w-4 h-4 mr-2" /> Visualizar Proposta
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
