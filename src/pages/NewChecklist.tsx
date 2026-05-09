import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { getChecklistTemplates, createChecklistExecution } from '@/services/checklists'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function NewChecklist() {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [template, setTemplate] = useState<any>(null)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [location, setLocation] = useState('')
  const [responses, setResponses] = useState<any[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    getChecklistTemplates()
      .then(setTemplates)
      .catch(() => toast.error('Erro ao carregar modelos'))
  }, [])

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplate(null)
      setResponses([])
      return
    }
    const t = templates.find((x) => x.id === selectedTemplateId)
    if (t) {
      setTemplate(t)
      const sortedItems = [...(t.items || [])].sort((a, b) => a.order - b.order)
      setResponses(
        sortedItems.map((item) => ({
          item_name: item.name,
          checked: false,
          observations: '',
        })),
      )
      setIsFinished(false)
      setSummary(null)
    }
  }, [selectedTemplateId, templates])

  const updateResponse = (index: number, field: string, value: any) => {
    const newResponses = [...responses]
    newResponses[index][field] = value
    setResponses(newResponses)
  }

  const checkedCount = responses.filter((r) => r.checked).length
  const totalCount = responses.length
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const handleFinish = async () => {
    if (!date) return toast.error('Data da inspeção é obrigatória')
    if (!location) return toast.error('Local da inspeção é obrigatório')

    try {
      const executionData = {
        template: selectedTemplateId,
        inspection_date: new Date(date).toISOString(),
        location,
        responses,
        compliance_score: progressPercent,
      }
      await createChecklistExecution(executionData)
      toast.success('Checklist finalizado com sucesso!')
      setIsFinished(true)
      setSummary({
        date,
        location,
        templateName: template.name,
        responses,
        compliance_score: progressPercent,
      })
    } catch (error) {
      toast.error('Erro ao salvar checklist')
    }
  }

  if (isFinished && summary) {
    const checkedItems = summary.responses.filter((r: any) => r.checked)
    const uncheckedItems = summary.responses.filter((r: any) => !r.checked)

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-50 dark:bg-slate-900 border-amber-500 shadow-elevation">
          <CardHeader className="border-b border-amber-500/30">
            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
              Relatório: {summary.templateName}
            </CardTitle>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              <p>
                <strong>Data:</strong> {format(new Date(summary.date), 'dd/MM/yyyy')}
              </p>
              <p>
                <strong>Local:</strong> {summary.location}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 rounded-lg border border-amber-500/20">
              <div className="text-4xl font-bold text-amber-500 mb-2">
                {summary.compliance_score}%
              </div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
                Conformidade
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  Itens Levados / Verificados ({checkedItems.length})
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {checkedItems.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="bg-white dark:bg-slate-950 p-3 rounded-md border border-amber-500/10"
                    >
                      <p className="font-medium">{item.item_name}</p>
                      {item.observations && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          Obs: {item.observations}
                        </p>
                      )}
                    </li>
                  ))}
                  {checkedItems.length === 0 && (
                    <p className="text-slate-500 italic">Nenhum item marcado.</p>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  Itens Esquecidos / Não Verificados ({uncheckedItems.length})
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {uncheckedItems.map((item: any, i: number) => (
                    <li
                      key={i}
                      className="bg-white dark:bg-slate-950 p-3 rounded-md border border-amber-500/10"
                    >
                      <p className="font-medium">{item.item_name}</p>
                      {item.observations && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          Obs: {item.observations}
                        </p>
                      )}
                    </li>
                  ))}
                  {uncheckedItems.length === 0 && (
                    <p className="text-slate-500 italic">Nenhum item esquecido.</p>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-amber-500/30 pt-6">
            <Button
              onClick={() => {
                setSelectedTemplateId('')
                setIsFinished(false)
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              Iniciar Novo Checklist
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-slate-50 dark:bg-slate-900 border-amber-500 shadow-elevation">
        <CardHeader className="border-b border-amber-500/30 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Modelo de Checklist</Label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-amber-500 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option
                  value=""
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  Selecione um modelo
                </option>
                {templates.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data da Inspeção</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-amber-500 focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Local da Inspeção</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Obra Alpha"
                className="border-amber-500 focus-visible:ring-amber-500"
              />
            </div>
          </div>
        </CardHeader>

        {template && (
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-300">
                <span>Progresso do Checklist</span>
                <span>
                  {checkedCount} de {totalCount} itens levados ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-amber-500/20">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-amber-500/30 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-amber-500/10 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-16 text-center">Status</th>
                    <th className="px-4 py-3 font-semibold w-1/3">Nome do Item</th>
                    <th className="px-4 py-3 font-semibold">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/30">
                  {responses.map((resp, idx) => (
                    <tr
                      key={idx}
                      className={`bg-white dark:bg-slate-950 transition-colors ${resp.checked ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                    >
                      <td className="px-4 py-3 text-center align-middle">
                        <Checkbox
                          checked={resp.checked}
                          onCheckedChange={(checked) =>
                            updateResponse(idx, 'checked', checked === true)
                          }
                          className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 h-5 w-5"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 align-middle">
                        {resp.item_name}
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={resp.observations}
                          onChange={(e) => updateResponse(idx, 'observations', e.target.value)}
                          placeholder="Notas..."
                          className="flex w-full rounded-md border border-amber-500/50 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] h-10 resize-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleFinish}
                className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
              >
                Finalizar Checklist
              </Button>
            </div>
          </CardContent>
        )}
        {!template && (
          <CardContent className="py-12 text-center text-slate-500">
            Selecione um modelo acima para iniciar o checklist.
          </CardContent>
        )}
      </Card>
    </div>
  )
}
