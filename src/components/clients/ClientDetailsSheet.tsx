import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Instagram,
  Facebook,
  Globe,
  FileText,
  Mail,
  Phone,
  User,
  MapPin,
  Building2,
  Hash,
  AlignLeft,
  Download,
  ExternalLink,
  Activity,
} from 'lucide-react'
import { Client } from '@/services/clients'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { FilePreviewModal, PreviewFile } from '@/components/FilePreviewModal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

const InfoRow = ({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode
  label: string
  value?: string | null
  className?: string
}) => {
  if (!value) return null
  return (
    <div className={cn('flex items-start gap-3 py-3', className)}>
      {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
      <div className="space-y-1.5 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  )
}

export function ClientDetailsSheet({ open, onOpenChange, client }: Props) {
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null)

  const getFileType = (filename: string): 'image' | 'pdf' | 'other' => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) return 'image'
    if (ext === 'pdf') return 'pdf'
    return 'other'
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      window.open(url, '_blank')
    }
  }

  const handleBatchDownload = async () => {
    if (!client?.documents) return
    for (const doc of client.documents) {
      const url = pb.files.getURL(client, doc)
      await downloadFile(url, doc)
    }
  }

  useEffect(() => {
    if (open && client) {
      setLoadingLogs(true)
      pb.collection('audit_logs')
        .getFullList({
          filter: `resource = 'clients' && details.client_id = '${client.id}'`,
          sort: '-created',
          expand: 'user_id',
        })
        .then((res) => {
          setLogs(res)
        })
        .catch((err) => {
          console.error('Error fetching logs, trying fallback filter', err)
          pb.collection('audit_logs')
            .getFullList({
              filter: `resource = 'clients' && details ~ '${client.id}'`,
              sort: '-created',
              expand: 'user_id',
            })
            .then(setLogs)
            .catch(console.error)
        })
        .finally(() => {
          setLoadingLogs(false)
        })
    } else {
      setLogs([])
    }
  }, [open, client])

  if (!client) return null

  const formatAddress = (c: Client) => {
    const parts = []
    if (c.logradouro) {
      parts.push(`${c.logradouro}${c.numero ? `, ${c.numero}` : ''}`)
    }
    if (c.bairro) parts.push(`Bairro: ${c.bairro}`)
    if (c.cidade) parts.push(`${c.cidade}${c.uf ? ` - ${c.uf}` : ''}`)
    if (c.cep) parts.push(`CEP: ${c.cep}`)

    if (parts.length > 0) return parts.join('\n')
    return c.address
  }

  const status = client.status || 'Ativo'
  const isActive = status === 'Ativo'
  const addressFormatted = formatAddress(client)
  const hasContact = client.contact_name || client.email || client.phone || client.alt_phone
  const hasSocial = client.website || client.instagram || client.facebook

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl">
        <div className="p-6 pb-5 bg-muted/30">
          <SheetHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <SheetTitle className="text-2xl font-bold leading-tight">{client.name}</SheetTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                  <Hash className="h-3.5 w-3.5" />
                  {client.code || 'Sem código'}
                </div>
              </div>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shrink-0 border shadow-sm',
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
                )}
              >
                {status}
              </span>
            </div>
          </SheetHeader>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Identificação */}
            {client.cnpj_cpf && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                  <Building2 className="h-4 w-4 text-primary" />
                  Identificação
                </h4>
                <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border">
                  <InfoRow className="px-4" label="CNPJ/CPF" value={client.cnpj_cpf} />
                </div>
              </div>
            )}

            {/* Contato */}
            {hasContact && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                  <User className="h-4 w-4 text-primary" />
                  Contato
                </h4>
                <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border">
                  <InfoRow
                    className="px-4"
                    icon={<User className="h-4 w-4" />}
                    label="Pessoa de Contato"
                    value={client.contact_name}
                  />
                  <InfoRow
                    className="px-4"
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={client.email}
                  />
                  <InfoRow
                    className="px-4"
                    icon={<Phone className="h-4 w-4" />}
                    label="Telefone Principal"
                    value={client.phone}
                  />
                  <InfoRow
                    className="px-4"
                    icon={<Phone className="h-4 w-4" />}
                    label="Telefone Alternativo"
                    value={client.alt_phone}
                  />
                </div>
              </div>
            )}

            {/* Endereço */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </h4>
              <div className="bg-card rounded-lg p-4 border border-border shadow-sm text-sm whitespace-pre-wrap leading-relaxed font-medium">
                {addressFormatted || (
                  <span className="text-muted-foreground italic font-normal">Não informado</span>
                )}
              </div>
            </div>

            {/* Presença Digital */}
            {hasSocial && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                  <Globe className="h-4 w-4 text-primary" />
                  Presença Digital
                </h4>
                <div className="flex flex-col gap-2">
                  {client.website && (
                    <a
                      href={
                        client.website.startsWith('http')
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium">{client.website}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {client.instagram && (
                    <a
                      href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Instagram className="h-5 w-5 text-pink-600" />
                        <span className="text-sm font-medium">{client.instagram}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {client.facebook && (
                    <a
                      href={
                        client.facebook.startsWith('http')
                          ? client.facebook
                          : `https://facebook.com/${client.facebook}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">{client.facebook}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Documentos */}
            {client.documents && client.documents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                    <FileText className="h-4 w-4 text-primary" />
                    Documentos
                  </h4>
                  {client.documents.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleBatchDownload}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Baixar Todos
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {client.documents.map((doc) => {
                    const url = pb.files.getURL(client, doc)
                    const type = getFileType(doc)
                    const isImage = type === 'image'
                    return (
                      <div
                        key={doc}
                        className="group relative flex flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div
                          className="aspect-[4/3] bg-muted/50 flex items-center justify-center cursor-pointer border-b border-border relative overflow-hidden"
                          onClick={() => {
                            if (type === 'image' || type === 'pdf') {
                              setPreviewFile({ url, name: doc, type })
                            } else {
                              window.open(url, '_blank')
                            }
                          }}
                        >
                          {isImage ? (
                            <img
                              src={url}
                              alt={doc}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                            <span className="text-white text-xs font-medium px-3 py-1.5 bg-black/40 rounded-full backdrop-blur-sm">
                              {type === 'image' || type === 'pdf' ? 'Visualizar' : 'Abrir'}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate flex-1" title={doc}>
                            {doc}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 z-20 hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadFile(url, doc)
                            }}
                            title="Baixar"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Observações Internas */}
            {client.notes && (
              <div className="space-y-3 pt-2">
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wide mb-3">
                    <AlignLeft className="h-4 w-4" />
                    Observações Internas
                  </h4>
                  <p className="text-sm text-amber-900/90 dark:text-amber-100/80 whitespace-pre-wrap leading-relaxed font-medium">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Histórico de Atividades */}
            <div className="space-y-3 pt-2">
              <h4 className="flex items-center gap-2 text-sm font-bold text-foreground/80 uppercase tracking-wide">
                <Activity className="h-4 w-4 text-primary" />
                Histórico de Atividades
              </h4>
              <div className="bg-card rounded-lg border border-border shadow-sm p-5 overflow-hidden">
                {loadingLogs ? (
                  <div className="text-sm text-muted-foreground text-center py-4 animate-pulse font-medium">
                    Carregando histórico...
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 font-medium">
                    Nenhuma atividade registrada até o momento.
                  </div>
                ) : (
                  <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
                    {logs.map((log) => {
                      const user = log.expand?.user_id
                      const userName = user?.name || user?.email || 'Sistema'
                      const avatarUrl =
                        user && user.avatar ? pb.files.getURL(user, user.avatar) : ''
                      return (
                        <div key={log.id} className="relative flex items-start gap-4 group">
                          <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-background shadow-sm shrink-0 group-hover:border-primary/50 transition-colors">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="text-[10px] uppercase font-bold text-muted-foreground bg-muted">
                                {userName.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex flex-col flex-1 pt-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground leading-none">
                                {log.action}
                              </p>
                              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap mt-0.5 shrink-0">
                                {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 truncate">
                              Por <span className="font-medium text-foreground/80">{userName}</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </Sheet>
  )
}
