import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { createBankAccount, updateBankAccount, type BankAccount } from '@/services/bank_accounts'

const formSchema = z.object({
  name: z.string().min(1, 'O nome da conta é obrigatório'),
  bank_name: z.string().min(1, 'O banco é obrigatório'),
  agency: z.string().optional(),
  account_number: z.string().optional(),
  balance: z.coerce.number().default(0),
  type: z.enum(['Corrente', 'Poupança', 'Investimento']),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: BankAccount
}

export function BankAccountForm({ open, onOpenChange, account }: Props) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      bank_name: '',
      agency: '',
      account_number: '',
      balance: 0,
      type: 'Corrente',
    },
  })

  useEffect(() => {
    if (open) {
      if (account) {
        form.reset({
          name: account.name,
          bank_name: account.bank_name,
          agency: account.agency || '',
          account_number: account.account_number || '',
          balance: account.balance,
          type: account.type,
        })
      } else {
        form.reset({
          name: '',
          bank_name: '',
          agency: '',
          account_number: '',
          balance: 0,
          type: 'Corrente',
        })
      }
    }
  }, [open, account, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (account) {
        await updateBankAccount(account.id, values)
        toast({ title: 'Conta atualizada com sucesso.' })
      } else {
        await createBankAccount(values)
        toast({ title: 'Conta criada com sucesso.' })
      }
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Erro ao salvar conta.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instituição Financeira</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Itaú, Bradesco, NuBank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Conta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 12345-6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Corrente">Corrente</SelectItem>
                        <SelectItem value="Poupança">Poupança</SelectItem>
                        <SelectItem value="Investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Atual (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Conta'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
