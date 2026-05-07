import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addMonths, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CalendarIcon, Wand2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { ServicoFinanceiro, Parcela } from '@/services/servicos_financeiros'

const schema = z.object({
  numeroParcelas: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo de 1 parcela')
    .max(120, 'Máximo de 120 parcelas'),
  dataPrimeira: z.date({ required_error: 'Selecione a data da primeira parcela' }),
})

interface GerarParcelasModalProps {
  servico: ServicoFinanceiro
  onGenerate: (parcelas: Parcela[]) => Promise<void>
}

export function GerarParcelasModal({ servico, onGenerate }: GerarParcelasModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      numeroParcelas: 1,
    },
  })

  const hasExisting = servico.parcelas && servico.parcelas.length > 0

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true)
    try {
      const numero = values.numeroParcelas
      const baseValue = Math.floor((servico.valor_total / numero) * 100) / 100
      let currentTotal = 0
      const parcelas: Parcela[] = []

      for (let i = 0; i < numero; i++) {
        const isLast = i === numero - 1
        const valor = isLast ? Number((servico.valor_total - currentTotal).toFixed(2)) : baseValue
        currentTotal += valor

        const vencimento = addMonths(values.dataPrimeira, i)

        parcelas.push({
          id: Math.random().toString(36).slice(2, 11),
          descricao: `Parcela ${String(i + 1).padStart(2, '0')}/${String(numero).padStart(2, '0')}`,
          valor,
          data_vencimento: format(vencimento, "yyyy-MM-dd'T'12:00:00.000'Z'"),
          status: 'Pendente',
        })
      }

      await onGenerate(parcelas)
      setOpen(false)
      form.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="whitespace-nowrap">
          <Wand2 className="w-4 h-4 mr-2" />
          Gerar Parcelas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerar Parcelas</DialogTitle>
          <DialogDescription>
            Divida o valor total de {formatCurrency(servico.valor_total)} em parcelas mensais
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {hasExisting && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 text-destructive border-none"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs mt-1">
                  Este serviço já possui parcelas. A geração irá <strong>sobrescrever</strong> todas
                  as existentes.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-2">
              <FormField
                control={form.control}
                name="numeroParcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        className="border-border bg-background text-foreground"
                        type="number"
                        min="1"
                        max="120"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataPrimeira"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel className="text-foreground">Data da Primeira Parcela</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal mt-1 border-border bg-background hover:bg-muted/50',
                              !field.value && 'text-muted-foreground',
                              field.value && 'text-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="hover:bg-muted text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Gerando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
