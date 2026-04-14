import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenerateTab } from '@/components/contracts/GenerateTab'
import { TemplatesTab } from '@/components/contracts/TemplatesTab'
import { HistoryTab } from '@/components/contracts/HistoryTab'
import { GeneratedContract } from '@/services/generated_contracts'
import { ClauseLibrary } from '@/components/contracts/ClauseLibrary'

export default function ContractCenter() {
  const [activeTab, setActiveTab] = useState('generate')
  const [editingContract, setEditingContract] = useState<GeneratedContract | null>(null)

  const handleEditDraft = (contract: GeneratedContract) => {
    setEditingContract(contract)
    setActiveTab('generate')
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
