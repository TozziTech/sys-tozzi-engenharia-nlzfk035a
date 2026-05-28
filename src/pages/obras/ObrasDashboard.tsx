import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Search, Building } from 'lucide-react'
import { format } from 'date-fns'

export default function ObrasDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [search, setSearch] = useState('')

  const fetchProjects = async () => {
    try {
      const records = await pb.collection('projects').getFullList({
        sort: '-created',
      })
      setProjects(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useRealtime('projects', () => {
    fetchProjects()
  })

  const filtered = useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.cno && p.cno.toLowerCase().includes(search.toLowerCase())),
    )
  }, [projects, search])

  const active = filtered.filter((p) => !p.is_archived)
  const archived = filtered.filter((p) => p.is_archived)

  const renderCards = (list: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {list.map((p) => {
        const spent = p.spent || 0
        const budget = p.budget || 0
        const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0

        return (
          <Link to={`/obras/${p.id}`} key={p.id}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.client || 'Sem cliente'}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Orçamento Executado</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>
                    Entrega: {p.end_date ? format(new Date(p.end_date), 'dd/MM/yyyy') : 'N/D'}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Obras</h1>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar obras por nome ou CNO..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Ativas ({active.length})</TabsTrigger>
          <TabsTrigger value="archived">Arquivadas ({archived.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {active.length === 0 ? (
            <p className="text-muted-foreground py-8">Nenhuma obra ativa encontrada.</p>
          ) : (
            renderCards(active)
          )}
        </TabsContent>
        <TabsContent value="archived">
          {archived.length === 0 ? (
            <p className="text-muted-foreground py-8">Nenhuma obra arquivada encontrada.</p>
          ) : (
            renderCards(archived)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
