import { useState, useEffect, useMemo } from 'react'
import { getBankAccounts, deleteBankAccount, type BankAccount } from '@/services/bank_accounts'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Pencil,
  Trash2,
  Landmark,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  CheckCircle,
} from 'lucide-react'
import { TransferForm } from '@/components/bank-accounts/TransferForm'
import { ReconciliationDashboard } from '@/components/bank-accounts/ReconciliationDashboard'
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
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [reconciliationAccount, setReconciliationAccount] = useState<BankAccount | undefined>()
  const [activeTab, setActiveTab] = useState('Todas')
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

  const globalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    if (activeTab === 'Todas') return accounts
    return accounts.filter((a) => a.type === activeTab)
  }, [accounts, activeTab])

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

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Corrente':
        return 'default'
      case 'Poupança':
        return 'secondary'
      case 'Investimento':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in-up duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            Contas Bancárias
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as instituições financeiras e o saldo consolidado da empresa.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => setIsTransferOpen(true)}
            variant="outline"
            className="bg-background"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transferência
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Saldo Consolidado Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(globalBalance)}
          </div>
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-lg bg-card/50 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">Nenhuma conta encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Você ainda não cadastrou nenhuma conta bancária. Adicione sua primeira conta para
            começar a gerenciar os saldos.
          </p>
          <Button onClick={openNew} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeira Conta
          </Button>
        </div>
      ) : (
        <Tabs
          defaultValue="Todas"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 bg-muted/50 p-1">
            <TabsTrigger value="Todas">Todas</TabsTrigger>
            <TabsTrigger value="Corrente">Corrente</TabsTrigger>
            <TabsTrigger value="Poupança">Poupança</TabsTrigger>
            <TabsTrigger value="Investimento">Investimento</TabsTrigger>
          </TabsList>

          {filteredAccounts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma conta encontrada para este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map((acc) => (
                <Card key={acc.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg line-clamp-1" title={acc.name}>
                            {acc.name}
                          </CardTitle>
                          {acc.code && (
                            <Badge
                              variant="outline"
                              className="text-xs font-mono text-muted-foreground"
                            >
                              {acc.code}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="font-medium">{acc.bank_name}</CardDescription>
                      </div>
                      <Badge variant={getBadgeVariant(acc.type)} className="shrink-0">
                        {acc.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <div className="text-2xl font-bold mb-2">{formatCurrency(acc.balance)}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>
                        Ag: {acc.agency || 'N/A'} • CC: {acc.account_number || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 pt-4 pb-4 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReconciliationAccount(acc)}
                      className="bg-background"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-500" />
                      Conciliar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(acc)}
                      className="bg-background"
                    >
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 border-destructive/20 bg-background"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a conta "{acc.name}"? Esta ação não pode
                            ser desfeita.
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
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      )}

      <BankAccountForm open={isFormOpen} onOpenChange={setIsFormOpen} account={editingAccount} />
      <TransferForm open={isTransferOpen} onOpenChange={setIsTransferOpen} accounts={accounts} />
      {reconciliationAccount && (
        <ReconciliationDashboard
          open={!!reconciliationAccount}
          onOpenChange={(open) => !open && setReconciliationAccount(undefined)}
          account={reconciliationAccount}
        />
      )}
    </div>
  )
}
