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
import { Plus, Trash, ArrowLeft, Check, InfoIcon, Eye, X, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export type QuoteItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export function QuoteGeneratorModal({ children }: { children?: React.ReactNode }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const [clientName, setClientName] = useState('')
  const [includedItems, setIncludedItems] = useState('')
  const [notIncludedItems, setNotIncludedItems] = useState('')
  const [observations, setObservations] = useState('')
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [paymentMethod, setPaymentMethod] = useState('')

  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ])

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

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [items],
  )

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setIsPreview(false)
      }, 300)
    }
  }

  const handleExport = () => {
    toast({
      title: 'Exportação Concluída',
      description: 'O orçamento foi exportado como PDF com sucesso.',
    })
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
          {!isPreview && (
            <div className="bg-blue-50/80 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
              <div className="flex">
                <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>Aviso:</strong> Os dados gerados aqui são apenas para pré-visualização e
                  não são persistidos. Eles serão perdidos ao recarregar a página.
                </p>
              </div>
            </div>
          )}

          {isPreview ? (
            <div className="space-y-8 bg-white text-slate-800 p-6 md:p-10 rounded-lg border shadow-sm mx-auto max-w-3xl relative">
              <div className="flex flex-col md:flex-row justify-between items-start border-b pb-6 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-slate-900">
                    Proposta Comercial
                  </h2>
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
              <div className="space-y-3">
                <Label htmlFor="clientName" className="text-sm font-semibold text-foreground/90">
                  Cliente / Empresa
                </Label>
                <Input
                  id="clientName"
                  placeholder="Nome do cliente ou empresa que receberá a proposta..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
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
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Edição
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                  </Button>
                  <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
                    <Check className="w-4 h-4 mr-2" /> Finalizar Orçamento
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
