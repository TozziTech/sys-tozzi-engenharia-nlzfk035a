import { useEffect, useState } from 'react'
import { FileText, Eye, Link as LinkIcon, Edit2 } from 'lucide-react'
import { GeneratedContract, getGeneratedContracts } from '@/services/generated_contracts'
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
import { ContractStatusBadge } from './ContractStatusBadge'
import { ContractPreview } from './ContractPreview'

export function HistoryTab({ onEditDraft }: { onEditDraft: (c: GeneratedContract) => void }) {
  const [contracts, setContracts] = useState<GeneratedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<GeneratedContract | null>(null)

  const loadContracts = async () => {
    try {
      const data = await getGeneratedContracts()
      setContracts(data)
    } catch {
      // quiet fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])
  useRealtime('generated_contracts', () => loadContracts())

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="rounded-md border bg-card overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum contrato gerado.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.client_name}</span>
                      <span className="text-xs text-muted-foreground">{c.client_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {c.expand?.template?.name || 'Excluído'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {c.status === 'Rascunho' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditDraft(c)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {c.status === 'Enviado para Assinatura' && c.signature_link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(c.signature_link, '_blank')}
                          title="Link"
                        >
                          <LinkIcon className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedContract(c)}
                        title="Visualizar"
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
            <div className="flex justify-between items-start">
              <div>
                <SheetTitle>Visualização</SheetTitle>
                <SheetDescription>Gerado para {selectedContract?.client_name}</SheetDescription>
              </div>
              <ContractStatusBadge status={selectedContract?.status} />
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0 relative">
            {selectedContract && <ContractPreview content={selectedContract.final_content} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
