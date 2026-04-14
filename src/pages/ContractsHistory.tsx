import { useEffect, useState } from 'react'
import { FileText, Eye, Mail } from 'lucide-react'
import {
  GeneratedContract,
  getGeneratedContracts,
  sendContractEmail,
} from '@/services/generated_contracts'
import { exportWord } from '@/lib/export'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

export default function ContractsHistory() {
  const [contracts, setContracts] = useState<GeneratedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null)

  const loadContracts = async () => {
    try {
      const data = await getGeneratedContracts()
      setContracts(data)
    } catch (error) {
      toast.error('Erro ao carregar histórico de contratos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  useRealtime('generated_contracts', () => {
    loadContracts()
  })

  const handleExportWord = (contract: GeneratedContract) => {
    const dateStr = new Date(contract.created).toLocaleDateString('pt-BR').replace(/\//g, '-')
    const filename = `Contrato_${contract.client_name.replace(/\s+/g, '_')}_${dateStr}.docx`
    exportWord(contract.final_content, filename)
    toast.success('Contrato exportado com sucesso.')
  }

  const handleResendEmail = async (contract: GeneratedContract) => {
    if (!contract.client_email) return
    try {
      toast.loading('Reenviando e-mail...', { id: `resend-${contract.id}` })
      await sendContractEmail(contract.client_email, contract.final_content, contract.client_name)
      toast.success('E-mail reenviado com sucesso!', { id: `resend-${contract.id}` })
    } catch (error) {
      toast.error('Erro ao reenviar e-mail.', { id: `resend-${contract.id}` })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Contratos</h1>
          <p className="text-muted-foreground">
            Visualize o histórico de todos os contratos gerados pelo sistema.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Data de Geração</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Modelo Utilizado</TableHead>
              <TableHead className="w-[150px]">Valor</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Carregando histórico...
                </TableCell>
              </TableRow>
            ) : contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Nenhum contrato gerado ainda.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    {new Date(contract.created).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(contract.created).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{contract.client_name}</span>
                      {contract.client_email && (
                        <span className="text-xs text-muted-foreground">
                          {contract.client_email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {contract.expand?.template?.name || 'Modelo Excluído'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.value
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(contract.value)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportWord(contract)}
                        title="Exportar para Word"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                      {contract.client_email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendEmail(contract)}
                          title="Reenviar E-mail"
                        >
                          <Mail className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedContract(contract)}
                        title="Visualizar Contrato"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedContract} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Visualização do Contrato</SheetTitle>
            <SheetDescription>
              Gerado para {selectedContract?.client_name} em{' '}
              {selectedContract && new Date(selectedContract.created).toLocaleDateString('pt-BR')}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 p-6 bg-muted/20">
            <div className="bg-white text-black shadow-sm mx-auto max-w-[210mm] min-h-[297mm] p-10 ring-1 ring-black/5">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed font-normal">
                {selectedContract?.final_content}
              </pre>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
