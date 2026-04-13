import { DollarSign } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialTransactions } from '@/components/financial/FinancialTransactions'
import { FinancialCategories } from '@/components/financial/FinancialCategories'
import { FinancialReports } from '@/components/financial/FinancialReports'
import { TransactionModal } from '@/components/financial/TransactionModal'

export default function Financial() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            Módulo Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie e registre as transações de todos os seus projetos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TransactionModal />
        </div>
      </div>

      <Tabs defaultValue="lancamentos" className="w-full space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 w-full justify-start overflow-x-auto h-auto flex-wrap">
          <TabsTrigger value="lancamentos" className="py-2">
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="py-2">
            Gestão de Categorias
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="py-2">
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="outline-none focus:outline-none m-0">
          <FinancialTransactions />
        </TabsContent>

        <TabsContent value="categorias" className="outline-none focus:outline-none m-0">
          <FinancialCategories />
        </TabsContent>

        <TabsContent value="relatorios" className="outline-none focus:outline-none m-0">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
