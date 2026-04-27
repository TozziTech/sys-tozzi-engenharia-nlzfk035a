import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenerateTab } from '@/components/contracts/GenerateTab'
import { TemplatesTab } from '@/components/contracts/TemplatesTab'
import { HistoryTab } from '@/components/contracts/HistoryTab'
import { GeneratedContract } from '@/services/generated_contracts'
import { ClauseLibrary } from '@/components/contracts/ClauseLibrary'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { AlertTriangle } from 'lucide-react'

export default function ContractCenter() {
  const [activeTab, setActiveTab] = useState('generate')
  const [editingContract, setEditingContract] = useState<GeneratedContract | null>(null)
  const { canAccess } = usePermissions()
  const { user } = useAuth()

  const handleEditDraft = (contract: GeneratedContract) => {
    setEditingContract(contract)
    setActiveTab('generate')
  }

  if (!canAccess('contratos') && user?.role !== 'Administrador') {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 animate-fade-in">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium">Acesso Restrito</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            Você não tem permissão para acessar o Gerador de Contratos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-6 gap-6">
      <div className="flex justify-between items-start gap-4 print:hidden">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Central de Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie modelos, gere novos documentos e acompanhe assinaturas em um só lugar.
          </p>
        </div>
        <ClauseLibrary />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0 mt-2"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3 print:hidden">
          <TabsTrigger value="generate">Gerar</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent
          value="generate"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=inactive]:hidden"
        >
          <GenerateTab
            editingContract={editingContract}
            onClearEdit={() => setEditingContract(null)}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent
          value="templates"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=inactive]:hidden overflow-hidden print:hidden"
        >
          <TemplatesTab />
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 min-h-0 mt-4 outline-none data-[state=inactive]:hidden overflow-hidden print:hidden"
        >
          <HistoryTab onEditDraft={handleEditDraft} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
