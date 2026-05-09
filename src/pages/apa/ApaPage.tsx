import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApaCreate from './ApaCreate'
import ApaHistory from './ApaHistory'
import ApaActions from './ApaActions'
import LessonsLearnedDashboard from './LessonsLearnedDashboard'
import { useSearchParams } from 'react-router-dom'
import { FileCheck } from 'lucide-react'

export default function ApaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-amber-500" />
            Análise Pós-Ação (APA)
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de lições aprendidas e ações corretivas dos projetos.
          </p>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 border border-border flex-wrap h-auto p-1 gap-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="new">Nova Análise</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="actions">Ações Corretivas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0 border-none p-0 focus-visible:outline-none">
          <LessonsLearnedDashboard />
        </TabsContent>
        <TabsContent value="new" className="m-0 border-none p-0 focus-visible:outline-none">
          <ApaCreate />
        </TabsContent>
        <TabsContent value="history" className="m-0 border-none p-0 focus-visible:outline-none">
          <ApaHistory />
        </TabsContent>
        <TabsContent value="actions" className="m-0 border-none p-0 focus-visible:outline-none">
          <ApaActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}
