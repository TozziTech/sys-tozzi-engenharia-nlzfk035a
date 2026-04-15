import { useState, useEffect } from 'react'
import { Calculator, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { DistributionChart } from './DistributionChart'
import { DistributionKPIs } from './DistributionKPIs'
import { DistributionHistoryTable } from './DistributionHistoryTable'
import { EditDistributionDialog } from './EditDistributionDialog'

const formSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  total_amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  nf_pct: z.coerce.number().min(0).max(100),
  expenses: z.coerce.number().min(0, 'Despesas não podem ser negativas'),
  art_amount: z.coerce.number().min(0, 'ART não pode ser negativo'),
  working_capital_pct: z.coerce.number().min(0).max(100),
  samuel_pct: z.coerce.number().min(0).max(100),
  tozzi_pct: z.coerce.number().min(0).max(100),
  date: z.string().min(1, 'Data é obrigatória'),
})
type FormValues = z.infer<typeof formSchema>

export function DistributionCalculator() {
  const [history, setHistory] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      total_amount: 0,
      nf_pct: 10,
      expenses: 0,
      art_amount: 108,
      working_capital_pct: 10,
      samuel_pct: 35,
      tozzi_pct: 65,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const loadHistory = async () => {
    try {
      const records = await pb
        .collection('distribution_calculations')
        .getFullList({ sort: '-date,-created' })
      setHistory(records)
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])
  useRealtime('distribution_calculations', () => {
    loadHistory()
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsCalculating(true)
      const nfAmount = values.total_amount * (values.nf_pct / 100)
      const deductions = values.expenses + values.art_amount + nfAmount
      const subtotal = Math.max(0, values.total_amount - deductions)
      const workingCapitalValue = subtotal * (values.working_capital_pct / 100)
      const netValue = Math.max(0, subtotal - workingCapitalValue)
      const samuelAmount = netValue * (values.samuel_pct / 100)
      const tozziAmount = netValue * (values.tozzi_pct / 100)
      const dateStr = values.date + 'T12:00:00.000Z'

      await pb.collection('distribution_calculations').create({
        description: values.description,
        total_amount: values.total_amount,
        nf_pct: values.nf_pct,
        nf_amount: nfAmount,
        expenses: values.expenses,
        art_amount: values.art_amount,
        working_capital_pct: values.working_capital_pct,
        samuel_pct: values.samuel_pct,
        tozzi_pct: values.tozzi_pct,
        net_value: netValue,
        samuel_amount: samuelAmount,
        tozzi_amount: tozziAmount,
        date: dateStr,
      })

      toast({ title: 'Cálculo salvo', description: 'Distribuição salva com sucesso.' })
      form.reset({
        ...form.getValues(),
        description: '',
        total_amount: 0,
        expenses: 0,
        art_amount: 108,
      })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    try {
      await pb.collection('distribution_calculations').delete(id)
      toast({ title: 'Registro excluído', description: 'O histórico foi atualizado.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const watchTotal = form.watch('total_amount') || 0
  const watchNFPct = form.watch('nf_pct') || 0
  const watchExpenses = form.watch('expenses') || 0
  const watchART = form.watch('art_amount') || 0
  const watchWCPct = form.watch('working_capital_pct') || 0
  const watchSamPct = form.watch('samuel_pct') || 0
  const watchTozPct = form.watch('tozzi_pct') || 0

  const previewNFAmount = watchTotal * (watchNFPct / 100)
  const previewDeductions = watchExpenses + watchART + previewNFAmount
  const previewSubtotal = Math.max(0, watchTotal - previewDeductions)
  const previewWC = previewSubtotal * (watchWCPct / 100)
  const previewNet = Math.max(0, previewSubtotal - previewWC)

  return (
    <div className="flex flex-col">
      <DistributionKPIs history={history} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                Calculadora de Distribuição
              </CardTitle>
              <CardDescription>Insira os valores para calcular o rateio.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Projeto X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="total_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nf_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NF (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>NF (R$)</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          value={formatCurrency(previewNFAmount)}
                          className="bg-muted font-medium text-muted-foreground"
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  <FormField
                    control={form.control}
                    name="expenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Despesas (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="art_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ART (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="working_capital_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capital Giro (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Capital Giro (R$)</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          value={formatCurrency(previewWC)}
                          className="bg-muted font-medium text-muted-foreground"
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="samuel_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Samuel (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tozzi_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tozzi (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-3 mt-6 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Valor Bruto:</span>
                      <span className="font-medium">{formatCurrency(watchTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-destructive/90">
                      <span className="text-sm">Deduções (Despesas + ART + NF):</span>
                      <span className="font-medium">-{formatCurrency(previewDeductions)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                      <span className="text-muted-foreground text-sm">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(previewSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-500/90">
                      <span className="text-sm">Capital de Giro ({watchWCPct}% do Subtotal):</span>
                      <span className="font-medium">-{formatCurrency(previewWC)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2">
                      <span className="text-muted-foreground text-sm">Líquido a Distribuir:</span>
                      <span className="font-semibold text-primary text-base">
                        {formatCurrency(previewNet)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        Samuel ({watchSamPct}%):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(previewNet > 0 ? previewNet * (watchSamPct / 100) : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Tozzi ({watchTozPct}%):</span>
                      <span className="font-medium">
                        {formatCurrency(previewNet > 0 ? previewNet * (watchTozPct / 100) : 0)}
                      </span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-2" disabled={isCalculating}>
                    {isCalculating ? 'Salvando...' : 'Salvar Distribuição'}
                    {!isCalculating && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
          <DistributionChart data={history} />
        </div>
      </div>

      <DistributionHistoryTable
        history={history}
        onDelete={handleDelete}
        onEdit={setEditingRecord}
      />

      <EditDistributionDialog
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSaved={loadHistory}
      />
    </div>
  )
}
