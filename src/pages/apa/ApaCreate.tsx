import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ApaCreate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/apa/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nova Análise Pós-Ação</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Criar APA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500">Módulo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
