import { DollarSign, BarChart3, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialTransactions } from '@/components/financial/FinancialTransactions'
import { FinancialCategories } from '@/components/financial/FinancialCategories'
import { TransactionModal } from '@/components/financial/TransactionModal'
import { FinancialAlerts } from '@/components/financial/FinancialAlerts'
import { DistributionCalculator } from '@/components/financial/DistributionCalculator'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useEffect } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import { exportFinancialPDF } from '@/lib/exportPdf'

export default function Financial() {
  const { canAccess } = usePermissions()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { transactions } = useProjectStore()

  const isAdminOrManager = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'
  const hasFinanceAccess = (canAccess && canAccess('lancamentos_financeiros')) || isAdminOrManager
  const hasDistributionAccess =
    user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'
  const hasCategoriesAccess = user?.role === 'Administrador'

  useEffect(() => {
    if (user && !hasFinanceAccess && user.role !== 'Administrador') {
      toast({
        title: 'Acesso restrito',
        description: 'Você não tem permissão para visualizar o módulo financeiro.',
        variant: 'destructive',
      })
      if (user.role === 'Projetista' || user.role === 'Estagiário') {
        navigate('/designer-panel', { replace: true })
      } else if (user.role === 'Cliente' || user.role === 'Visitante') {
        navigate('/client-dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [hasFinanceAccess, user, navigate, toast])

  if (!user) return null
  if (!hasFinanceAccess && user.role !== 'Administrador') return null

  const handleExportPDF = () => {
    const safeTx = Array.isArray(transactions) ? transactions : []
    const totals = safeTx.reduce(
      (acc, tx) => {
        const val = tx.value || (tx as any).amount || 0
        if (tx.type === 'Entrada') acc.revenue += val
        else acc.expenses += val
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
    exportFinancialPDF(
      safeTx,
      totals,
      'Todos os Registros (Acesso Permitido)',
      user.name || 'Usuário',
    )
  }

  return (
    <div className="w-full p-6 md:p-8 mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            Módulo Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e registre as transações de todos os seus projetos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar Relatório (PDF)
          </Button>
          {isAdminOrManager && (
            <Button variant="outline" asChild className="gap-2">
              <Link to="/financial-dashboard">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
          {hasFinanceAccess && <TransactionModal />}
        </div>
      </div>

      <ErrorBoundary>
        <FinancialAlerts />
      </ErrorBoundary>

      <Tabs defaultValue="lancamentos" className="w-full space-y-6">
        <TabsList className="bg-muted p-1 w-full justify-start overflow-x-auto h-auto flex-wrap">
          <TabsTrigger value="lancamentos" className="py-2">
            Lançamentos
          </TabsTrigger>
          {hasCategoriesAccess && (
            <TabsTrigger value="categorias" className="py-2">
              Gestão de Categorias
            </TabsTrigger>
          )}
          {hasDistributionAccess && (
            <TabsTrigger value="distribuicao" className="py-2">
              Calculadora de Distribuição
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="lancamentos" className="outline-none focus:outline-none m-0">
          <ErrorBoundary>
            <FinancialTransactions />
          </ErrorBoundary>
        </TabsContent>

        {hasCategoriesAccess && (
          <TabsContent value="categorias" className="outline-none focus:outline-none m-0">
            <ErrorBoundary>
              <FinancialCategories />
            </ErrorBoundary>
          </TabsContent>
        )}

        {hasDistributionAccess && (
          <TabsContent value="distribuicao" className="outline-none focus:outline-none m-0">
            <ErrorBoundary>
              <DistributionCalculator />
            </ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
