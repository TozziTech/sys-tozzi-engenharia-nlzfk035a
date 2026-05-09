import { Suspense, lazy, useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams } from 'react-router-dom'
import { FileCheck, Loader2 } from 'lucide-react'

const ApaCreate = lazy(() => import('./ApaCreate'))
const ApaHistory = lazy(() => import('./ApaHistory'))
const ApaActions = lazy(() => import('./ApaActions'))
const LessonsLearnedDashboard = lazy(() => import('./LessonsLearnedDashboard'))

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64 text-muted-foreground">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
)

export default function ApaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  // Keep track of visited tabs to persist state and prevent re-fetching
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([currentTab]))

  useEffect(() => {
    setVisitedTabs((prev) => {
      const newSet = new Set(prev)
      newSet.add(currentTab)
      return newSet
    })
  }, [currentTab])

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

        <TabsContent
          value="dashboard"
          forceMount
          className={
            currentTab === 'dashboard' ? 'm-0 border-none p-0 focus-visible:outline-none' : 'hidden'
          }
        >
          {visitedTabs.has('dashboard') && (
            <Suspense fallback={<LoadingFallback />}>
              <LessonsLearnedDashboard />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent
          value="new"
          forceMount
          className={
            currentTab === 'new' ? 'm-0 border-none p-0 focus-visible:outline-none' : 'hidden'
          }
        >
          {visitedTabs.has('new') && (
            <Suspense fallback={<LoadingFallback />}>
              <ApaCreate />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent
          value="history"
          forceMount
          className={
            currentTab === 'history' ? 'm-0 border-none p-0 focus-visible:outline-none' : 'hidden'
          }
        >
          {visitedTabs.has('history') && (
            <Suspense fallback={<LoadingFallback />}>
              <ApaHistory />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent
          value="actions"
          forceMount
          className={
            currentTab === 'actions' ? 'm-0 border-none p-0 focus-visible:outline-none' : 'hidden'
          }
        >
          {visitedTabs.has('actions') && (
            <Suspense fallback={<LoadingFallback />}>
              <ApaActions />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
