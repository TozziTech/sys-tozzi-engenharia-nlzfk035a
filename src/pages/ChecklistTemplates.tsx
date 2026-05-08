import { useState, useEffect } from 'react'
import { Plus, Edit2, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getChecklistTemplates,
  deleteChecklistTemplate,
  createChecklistTemplate,
} from '@/services/checklists'
import { toast } from 'sonner'
import { ChecklistTemplateModal } from '@/components/checklists/ChecklistTemplateModal'

export default function ChecklistTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const loadData = async () => {
    try {
      const data = await getChecklistTemplates()
      setTemplates(data)
    } catch (error) {
      toast.error('Erro ao carregar modelos')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDuplicate = async (template: any) => {
    try {
      await createChecklistTemplate({
        name: `${template.name} (Cópia)`,
        service_type: template.service_type,
        items: template.items,
      })
      toast.success('Modelo duplicado com sucesso!')
      loadData()
    } catch (error) {
      toast.error('Erro ao duplicar modelo')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este modelo?')) return
    try {
      await deleteChecklistTemplate(id)
      toast.success('Modelo excluído com sucesso!')
      loadData()
    } catch (error) {
      toast.error('Erro ao excluir modelo')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Modelos de Checklist
        </h1>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            setEditingTemplate(null)
            setIsModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900 border-amber-500 shadow-elevation">
        <CardHeader className="border-b border-amber-500/30">
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
            Modelos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-amber-500/10 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Tipo de Serviço</th>
                  <th className="px-4 py-3 font-semibold">Quantidade de Itens</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/30">
                {templates.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-amber-500/5 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 capitalize">{t.service_type}</td>
                    <td className="px-4 py-3">{t.items?.length || 0} itens</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-amber-600"
                        onClick={() => {
                          setEditingTemplate(t)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-blue-600"
                        onClick={() => handleDuplicate(t)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Nenhum modelo cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ChecklistTemplateModal
          template={editingTemplate}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
