import { DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialTransactions } from '@/components/financial/FinancialTransactions'
import { FinancialCategories } from '@/components/financial/FinancialCategories'
import { TransactionModal } from '@/components/financial/TransactionModal'
import { FinancialAlerts } from '@/components/financial/FinancialAlerts'
import { RecurringExpensesCard } from '@/components/financial/RecurringExpensesCard'
import { RecurringExpensesChart } from '@/components/financial/RecurringExpensesChart'
import { DistributionCalculator } from '@/components/financial/DistributionCalculator'

export default function Financial() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
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
          <TransactionModal />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
          Resumo Analítico
        </h2>
        <div className="grid gap-4 md:grid-cols-3 items-stretch">
          <div className="md:col-span-1">
            <RecurringExpensesCard />
          </div>
          <div className="md:col-span-2">
            <RecurringExpensesChart />
          </div>
        </div>
      </div>

      <FinancialAlerts />

      <Tabs defaultValue="lancamentos" className="w-full space-y-6">
        <TabsList className="bg-muted p-1 w-full justify-start overflow-x-auto h-auto flex-wrap">
          <TabsTrigger value="lancamentos" className="py-2">
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="py-2">
            Gestão de Categorias
          </TabsTrigger>
          <TabsTrigger value="distribuicao" className="py-2">
            Calculadora de Distribuição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="outline-none focus:outline-none m-0">
          <FinancialTransactions />
        </TabsContent>

        <TabsContent value="categorias" className="outline-none focus:outline-none m-0">
          <FinancialCategories />
        </TabsContent>

        <TabsContent value="distribuicao" className="outline-none focus:outline-none m-0">
          <DistributionCalculator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
