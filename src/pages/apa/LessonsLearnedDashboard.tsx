import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function LessonsLearnedDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Análise Pós-Ação (APA)</h1>
        <Button asChild>
          <Link to="/apa/new">
            <Plus className="mr-2 h-4 w-4" /> Nova APA
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lições Aprendidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500">Módulo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
