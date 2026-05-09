import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NewChecklist from '../NewChecklist'
import ChecklistHistory from '../ChecklistHistory'
import { useSearchParams } from 'react-router-dom'
import { FileCheck } from 'lucide-react'

export default function ChecklistsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'new'

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-amber-500" />
            Gestão de Checklists
          </h2>
          <p className="text-muted-foreground mt-1">
            Realize novas inspeções e acompanhe o histórico de checklists.
          </p>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 border border-border flex-wrap h-auto p-1 gap-2">
          <TabsTrigger value="new">Novo Checklist</TabsTrigger>
          <TabsTrigger value="history">Histórico de Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="m-0 border-none p-0 focus-visible:outline-none">
          <NewChecklist />
        </TabsContent>
        <TabsContent value="history" className="m-0 border-none p-0 focus-visible:outline-none">
          <ChecklistHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
