import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { DisciplineTemplateDialog } from '@/components/templates/DisciplineTemplateDialog'

export default function DisciplineTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const res = await pb.collection('discipline_templates').getFullList({ sort: '-created' })
      setTemplates(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Deseja excluir este template? Todas as tarefas padrão associadas também serão apagadas.',
      )
    )
      return
    try {
      await pb.collection('discipline_templates').delete(id)
      toast({ title: 'Modelo excluído com sucesso' })
      load()
    } catch (e) {
      toast({ title: 'Erro ao excluir modelo', variant: 'destructive' })
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modelos de Disciplina</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates e tarefas predefinidas para facilitar a criação de módulos.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedId(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <Card key={t.id} className="group hover:border-primary/50 transition-colors shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-start">
                <span className="line-clamp-2 pr-2 leading-tight">{t.name}</span>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedId(t.id)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
                {t.description || 'Nenhuma descrição fornecida para este modelo.'}
              </p>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-card/50 text-muted-foreground">
            <p>Nenhum modelo cadastrado.</p>
            <Button
              variant="link"
              onClick={() => {
                setSelectedId(null)
                setIsDialogOpen(true)
              }}
            >
              Criar o primeiro modelo
            </Button>
          </div>
        )}
      </div>

      <DisciplineTemplateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          load()
        }}
        templateId={selectedId}
      />
    </div>
  )
}
