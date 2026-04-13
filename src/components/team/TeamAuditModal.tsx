import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function TeamAuditModal() {
  const [logs, setLogs] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const loadLogs = async () => {
    try {
      const records = await pb.collection('audit_logs').getList(1, 50, {
        filter: 'resource = "users"',
        sort: '-created',
        expand: 'user_id',
      })
      setLogs(records.items)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
  }

  useEffect(() => {
    if (open) {
      loadLogs()
    }
  }, [open])

  useRealtime(
    'audit_logs',
    () => {
      if (open) loadLogs()
    },
    open,
  )

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '')
      return <span className="text-muted-foreground italic">Vazio</span>
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const formatFieldName = (field: string) => {
    const map: Record<string, string> = {
      name: 'Nome',
      codigo: 'Código',
      role: 'Nível de Acesso',
      status: 'Status',
      formacao: 'Formação',
      phone: 'Telefone',
      altPhone: 'Telefone Alt.',
      logradouro: 'Endereço',
      bairro: 'Bairro',
      cidade: 'Cidade',
      uf: 'UF',
      cep: 'CEP',
      crea: 'CREA',
      cpf: 'CPF',
      rg: 'RG',
      banco_nome: 'Banco',
      agencia: 'Agência',
      conta: 'Conta',
      chave_pix: 'Chave PIX',
      documentos_link: 'Link de Documentos',
      avatar: 'Avatar',
    }
    return map[field] || field
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Histórico de Atividades</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5 text-primary" />
            Histórico de Alterações da Equipe
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 mt-4">
          <div className="space-y-6">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro de alteração encontrado.
              </div>
            ) : (
              logs.map((log) => {
                const details = log.details || {}
                const oldValues = details.old_values || {}
                const newValues = details.new_values || {}
                const changedFields = Object.keys(newValues)

                return (
                  <div
                    key={log.id}
                    className="relative pl-6 border-l-2 border-border/60 pb-6 last:pb-0"
                  >
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-background" />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-semibold text-base">{log.action}</div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created), "dd/MM/yyyy 'às' HH:mm")}
                        </time>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        Por:{' '}
                        <Badge variant="secondary" className="font-medium">
                          {log.expand?.user_id?.name || 'Sistema'}
                        </Badge>
                      </div>

                      {changedFields.length > 0 && (
                        <div className="mt-2 bg-muted/30 rounded-lg p-3 border border-border/50 space-y-2">
                          {changedFields.map((field) => (
                            <div
                              key={field}
                              className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] items-start gap-2 text-sm"
                            >
                              <div
                                className="font-medium text-foreground/80 truncate pr-2"
                                title={formatFieldName(field)}
                              >
                                {formatFieldName(field)}:
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-xs line-through break-all">
                                  {formatValue(oldValues[field])}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs font-medium break-all">
                                  {formatValue(newValues[field])}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
