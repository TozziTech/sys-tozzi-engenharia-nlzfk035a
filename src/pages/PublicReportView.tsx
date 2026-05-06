import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, FileText, Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'

export default function PublicReportView() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    if (!token) return

    const loadReport = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try getting from a hypothetical backend endpoint
        try {
          const res = await pb.send(`/backend/v1/public/reports/${token}`, { method: 'GET' })
          setReport(res)
        } catch (apiErr: any) {
          // If the custom endpoint is not available, try searching in project_reports_history
          try {
            const records = await pb.collection('project_reports_history').getList(1, 1, {
              filter: `token = '${token}' || id = '${token}'`,
            })
            if (records.items.length > 0) {
              setReport(records.items[0])
            } else {
              throw new Error('Relatório não encontrado ou link expirado.')
            }
          } catch (dbErr: any) {
            throw new Error('Relatório não encontrado ou link expirado.')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao carregar o relatório.')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [token])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p>Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao acessar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Relatório de Acompanhamento
            </h1>
            <p className="text-sm text-zinc-500">Visualização Pública</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="bg-zinc-100/50 dark:bg-zinc-900/50 border-b">
            <CardTitle>{report.title || report.name || 'Detalhes do Relatório'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {report.content && (
              <div
                className="prose dark:prose-invert max-w-none prose-zinc prose-headings:font-bold prose-a:text-amber-600"
                dangerouslySetInnerHTML={{ __html: report.content }}
              />
            )}

            {report.description && !report.content && (
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {report.description}
              </p>
            )}

            {!report.content && !report.description && (
              <div className="text-center py-8 text-zinc-500 italic border border-dashed rounded-lg">
                Nenhum texto adicional foi fornecido para este relatório.
              </div>
            )}

            {report.file && report.collectionId && report.id && (
              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    Documento Anexo
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Baixe o arquivo original para visualização completa.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <a
                    href={pb.files.getUrl(report, report.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-zinc-400 pt-8">
          <p>Este é um link público e seguro gerado pelo sistema.</p>
          <p>&copy; {new Date().getFullYear()} Tozzi Engenharia. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
