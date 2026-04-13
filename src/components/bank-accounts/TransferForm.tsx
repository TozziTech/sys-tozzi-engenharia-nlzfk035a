import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { transferFunds, type BankAccount } from '@/services/bank_accounts'

const formSchema = z
  .object({
    from_account_id: z.string().min(1, 'Selecione a conta de origem'),
    to_account_id: z.string().min(1, 'Selecione a conta de destino'),
    amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero'),
    date: z.string().min(1, 'A data é obrigatória'),
    description: z.string().optional(),
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'A conta de origem e destino devem ser diferentes',
    path: ['to_account_id'],
  })

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: BankAccount[]
}

export function TransferForm({ open, onOpenChange, accounts }: Props) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from_account_id: '',
      to_account_id: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        from_account_id: '',
        to_account_id: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
    }
  }, [open, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await transferFunds({
        from_account_id: values.from_account_id,
        to_account_id: values.to_account_id,
        amount: values.amount,
        date: values.date,
        description: values.description || '',
      })
      toast({ title: 'Transferência realizada com sucesso.' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Erro ao realizar transferência.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
          <DialogDescription>
            Mova saldo de uma conta para outra. Isso registrará uma saída na conta de origem e uma
            entrada na conta de destino.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta de Origem</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code ? `${acc.code} - ` : ''}
                          {acc.name} (
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(acc.balance)}
                          )
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
              name="to_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta de Destino</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code ? `${acc.code} - ` : ''}
                          {acc.name}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Transferência para cobrir despesas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Transferindo...' : 'Realizar Transferência'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
