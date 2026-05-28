import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  LayoutDashboard,
  DollarSign,
  Calendar,
  Package,
  Wrench,
  FileText,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ObraDadosGerais } from './tabs/ObraDadosGerais'
import { ObraFinanceiro } from './tabs/ObraFinanceiro'
import { ObraCronograma } from './tabs/ObraCronograma'
import { ObraEstoque } from './tabs/ObraEstoque'
import { ObraRecursos } from './tabs/ObraRecursos'
import { ObraAnotacoes } from './tabs/ObraAnotacoes'
import { ObraDocumentos } from './tabs/ObraDocumentos'

export default function ObraDetails() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    if (id) {
      pb.collection('projects').getOne(id).then(setProject).catch(console.error)
    }
  }, [id])

  if (!project) return <div className="p-8">Carregando...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex-1 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/obras">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.cno ? `CNO: ${project.cno}` : 'Sem CNO'}</p>
        </div>
      </div>

      <Tabs defaultValue="gerais" className="flex-1 flex flex-col h-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="gerais" className="gap-2 shrink-0">
            <LayoutDashboard className="w-4 h-4" /> Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2 shrink-0">
            <DollarSign className="w-4 h-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="gap-2 shrink-0">
            <Calendar className="w-4 h-4" /> Cronograma
          </TabsTrigger>
          <TabsTrigger value="estoque" className="gap-2 shrink-0">
            <Package className="w-4 h-4" /> Estoque
          </TabsTrigger>
          <TabsTrigger value="recursos" className="gap-2 shrink-0">
            <Wrench className="w-4 h-4" /> Recursos
          </TabsTrigger>
          <TabsTrigger value="anotacoes" className="gap-2 shrink-0">
            <FileText className="w-4 h-4" /> Anotações
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2 shrink-0">
            <FolderOpen className="w-4 h-4" /> Documentos
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex-1">
          <TabsContent value="gerais" className="m-0 h-full">
            <ObraDadosGerais project={project} onUpdate={setProject} />
          </TabsContent>
          <TabsContent value="financeiro" className="m-0 h-full">
            <ObraFinanceiro projectId={project.id} />
          </TabsContent>
          <TabsContent value="cronograma" className="m-0 h-full">
            <ObraCronograma projectId={project.id} />
          </TabsContent>
          <TabsContent value="estoque" className="m-0 h-full">
            <ObraEstoque projectId={project.id} />
          </TabsContent>
          <TabsContent value="recursos" className="m-0 h-full">
            <ObraRecursos projectId={project.id} />
          </TabsContent>
          <TabsContent value="anotacoes" className="m-0 h-full">
            <ObraAnotacoes projectId={project.id} />
          </TabsContent>
          <TabsContent value="documentos" className="m-0 h-full">
            <ObraDocumentos projectId={project.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
