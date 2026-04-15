import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calculator, Save, Trash2, History } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

const formSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  total_amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  expenses: z.coerce.number().min(0, 'Despesas não podem ser negativas'),
  working_capital_pct: z.coerce.number().min(0).max(100),
  samuel_pct: z.coerce.number().min(0).max(100),
  tozzi_pct: z.coerce.number().min(0).max(100),
  date: z.string().min(1, 'Data é obrigatória'),
})

type FormValues = z.infer<typeof formSchema>

export function DistributionCalculator() {
  const [history, setHistory] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      total_amount: 0,
      expenses: 0,
      working_capital_pct: 10,
      samuel_pct: 50,
      tozzi_pct: 50,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const loadHistory = async () => {
    try {
      const records = await pb.collection('distribution_calculations').getFullList({
        sort: '-date,-created',
      })
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

      const netValue =
        values.total_amount -
        values.expenses -
        values.total_amount * (values.working_capital_pct / 100)
      const samuelAmount = netValue * (values.samuel_pct / 100)
      const tozziAmount = netValue * (values.tozzi_pct / 100)

      const dateStr = values.date + 'T12:00:00.000Z'

      await pb.collection('distribution_calculations').create({
        description: values.description,
        total_amount: values.total_amount,
        expenses: values.expenses,
        working_capital_pct: values.working_capital_pct,
        samuel_pct: values.samuel_pct,
        tozzi_pct: values.tozzi_pct,
        net_value: netValue,
        samuel_amount: samuelAmount,
        tozzi_amount: tozziAmount,
        date: dateStr,
      })

      toast({
        title: 'Cálculo salvo',
        description: 'A distribuição foi calculada e salva com sucesso.',
      })
      form.reset({ ...form.getValues(), description: '', total_amount: 0, expenses: 0 })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o cálculo.',
        variant: 'destructive',
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    try {
      await pb.collection('distribution_calculations').delete(id)
      toast({
        title: 'Registro excluído',
        description: 'O histórico foi atualizado.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const watchTotal = form.watch('total_amount') || 0
  const watchExpenses = form.watch('expenses') || 0
  const watchWCPct = form.watch('working_capital_pct') || 0
  const watchSamPct = form.watch('samuel_pct') || 0
  const watchTozPct = form.watch('tozzi_pct') || 0

  const previewWorkingCapital = watchTotal * (watchWCPct / 100)
  const previewNetValue = watchTotal - watchExpenses - previewWorkingCapital
  const previewSamAmount = previewNetValue > 0 ? previewNetValue * (watchSamPct / 100) : 0
  const previewTozAmount = previewNetValue > 0 ? previewNetValue * (watchTozPct / 100) : 0

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in-up">
      <div className="xl:col-span-1 space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Calculadora de Distribuição
            </CardTitle>
            <CardDescription>
              Insira os valores recebidos e despesas para calcular a distribuição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição / Projeto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pagamento Projeto X" {...field} />
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
                  <h4 className="font-semibold text-sm text-foreground mb-1">Prévia do Cálculo</h4>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Líquido a Distribuir:</span>
                    <span className="font-semibold text-primary text-base">
                      {formatCurrency(previewNetValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Samuel ({watchSamPct}%):</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(previewSamAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Tozzi ({watchTozPct}%):</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(previewTozAmount)}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isCalculating}>
                  {isCalculating ? 'Calculando e Salvando...' : 'Salvar Distribuição'}
                  {!isCalculating && <Save className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-2 space-y-6">
        <Card className="h-full border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Histórico de Lançamentos
            </CardTitle>
            <CardDescription>
              Listagem de todas as distribuições calculadas e salvas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 sm:p-6 sm:pt-0">
            <div className="rounded-md border border-border/50 h-full max-h-[600px] overflow-y-auto relative">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[100px] bg-muted/50">Data</TableHead>
                    <TableHead className="bg-muted/50">Descrição</TableHead>
                    <TableHead className="text-right bg-muted/50">Valor Total</TableHead>
                    <TableHead className="text-right bg-muted/50">Líquido</TableHead>
                    <TableHead className="text-right text-emerald-600 dark:text-emerald-500 bg-muted/50">
                      Samuel
                    </TableHead>
                    <TableHead className="text-right text-blue-600 dark:text-blue-500 bg-muted/50">
                      Tozzi
                    </TableHead>
                    <TableHead className="w-[50px] bg-muted/50"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Nenhum histórico de distribuição encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id} className="group transition-colors">
                        <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                          {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell
                          className="font-medium max-w-[200px] truncate"
                          title={item.description}
                        >
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          {formatCurrency(item.net_value)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-emerald-600 dark:text-emerald-500 font-semibold">
                          {formatCurrency(item.samuel_amount)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-blue-600 dark:text-blue-500 font-semibold">
                          {formatCurrency(item.tozzi_amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
