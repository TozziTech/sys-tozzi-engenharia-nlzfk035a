import { useState, useEffect } from 'react'
import { getBankAccounts, deleteBankAccount, type BankAccount } from '@/services/bank_accounts'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BankAccountForm } from '@/components/bank-accounts/BankAccountForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [editingAccount, setEditingAccount] = useState<BankAccount | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  const loadAccounts = async () => {
    try {
      const data = await getBankAccounts()
      setAccounts(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar contas bancárias.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  useRealtime('bank_accounts', () => loadAccounts())

  const handleDelete = async (id: string) => {
    try {
      await deleteBankAccount(id)
      toast({ title: 'Conta excluída com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro ao excluir conta.', variant: 'destructive' })
    }
  }

  const openEdit = (acc: BankAccount) => {
    setEditingAccount(acc)
    setIsFormOpen(true)
  }

  const openNew = () => {
    setEditingAccount(undefined)
    setIsFormOpen(true)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as instituições financeiras e saldos da empresa.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-semibold">Nome</TableHead>
              <TableHead className="text-center font-semibold">Banco</TableHead>
              <TableHead className="text-center font-semibold">Agência / Conta</TableHead>
              <TableHead className="text-center font-semibold">Tipo</TableHead>
              <TableHead className="text-center font-semibold">Saldo</TableHead>
              <TableHead className="text-center font-semibold w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhuma conta bancária cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => (
                <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-center">{acc.name}</TableCell>
                  <TableCell className="text-center">{acc.bank_name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {acc.agency || '-'} / {acc.account_number || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="mx-auto font-normal">
                      {acc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatCurrency(acc.balance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(acc)}
                        className="h-8 w-8 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a conta "{acc.name}"? Esta ação não
                              pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(acc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BankAccountForm open={isFormOpen} onOpenChange={setIsFormOpen} account={editingAccount} />
    </div>
  )
}
