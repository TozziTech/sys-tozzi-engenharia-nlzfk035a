import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { exportWord } from '@/lib/export'
import { exportContractPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'

export function ContractPreview({
  content,
  clientName = 'Cliente',
}: {
  content: string
  clientName?: string
}) {
  const { user } = useAuth()

  const handleExportDOCX = () => {
    if (!content) return
    const date = format(new Date(), 'yyyy-MM-dd')
    const filename = `Contrato_${clientName.replace(/\s+/g, '_')}_${date}.docx`
    exportWord(content, filename)
  }

  const handleExportPDF = () => {
    if (!content) return
    exportContractPDF({ final_content: content, client_name: clientName }, user?.name || 'Usuário')
  }

  return (
    <div className="flex flex-col h-full">
      {content && (
        <div className="flex justify-end gap-2 p-2 bg-muted/50 border-b print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="bg-background shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2 text-red-600" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDOCX}
            className="bg-background shadow-sm"
          >
            <Download className="h-4 w-4 mr-2 text-blue-600" />
            Exportar DOCX
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1 p-6 bg-muted/20">
        <div className="bg-white text-black shadow-sm mx-auto max-w-[210mm] min-h-[297mm] p-10 sm:p-16 ring-1 ring-black/5">
          <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed font-normal">
            {content}
          </pre>
        </div>
      </ScrollArea>
    </div>
  )
}
