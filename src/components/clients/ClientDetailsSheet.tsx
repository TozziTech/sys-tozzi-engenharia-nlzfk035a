import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Instagram, Facebook, Globe, FileText } from 'lucide-react'
import { Client } from '@/services/clients'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
}

export function ClientDetailsSheet({ open, onOpenChange, client }: Props) {
  if (!client) return null

  const formatAddress = (c: Client) => {
    if (c.logradouro || c.cidade || c.cep) {
      return [
        c.logradouro,
        c.numero ? `, ${c.numero}` : '',
        c.bairro ? ` - ${c.bairro}` : '',
        c.cidade ? ` - ${c.cidade}` : '',
        c.uf ? `/${c.uf}` : '',
        c.cep ? ` (CEP: ${c.cep})` : '',
      ]
        .filter(Boolean)
        .join('')
    }
    return c.address || 'Não informado'
  }

  const status = client.status || 'Ativo'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 mt-4">
            <SheetTitle className="text-xl">{client.name}</SheetTitle>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider shrink-0',
                status === 'Ativo'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
              )}
            >
              {status}
            </span>
          </div>
          <SheetDescription>Resumo de dados do cliente</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Administrativo
            </h4>
            <div className="space-y-3 text-sm bg-muted/30 p-3 rounded-md border border-border/50">
              <p>
                <span className="font-medium text-foreground">Código:</span>{' '}
                <span className="font-mono">{client.code || 'Não gerado'}</span>
              </p>
              {client.notes && (
                <div>
                  <span className="font-medium text-foreground">Observações:</span>
                  <p className="whitespace-pre-wrap mt-1 text-muted-foreground bg-background p-2 rounded-sm border text-xs">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Contato
            </h4>
            <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-md border border-border/50">
              <p>
                <span className="font-medium text-foreground">Nome:</span>{' '}
                {client.contact_name || '-'}
              </p>
              <p>
                <span className="font-medium text-foreground">Email:</span> {client.email || '-'}
              </p>
              <p>
                <span className="font-medium text-foreground">Telefone Principal:</span>{' '}
                {client.phone || '-'}
              </p>
              <p>
                <span className="font-medium text-foreground">Telefone Alt.:</span>{' '}
                {client.alt_phone || '-'}
              </p>
              <p>
                <span className="font-medium text-foreground">CNPJ/CPF:</span>{' '}
                {client.cnpj_cpf || '-'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Endereço
            </h4>
            <div className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">
              {formatAddress(client)}
            </div>
          </div>

          {client.documents && client.documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Documentos
              </h4>
              <div className="flex flex-col gap-2 text-sm bg-muted/30 p-3 rounded-md border border-border/50">
                {client.documents.map((doc) => (
                  <a
                    key={doc}
                    href={pb.files.getURL(client, doc)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline bg-background p-2 rounded-sm border"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{doc}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Redes Sociais e Site
            </h4>
            <div className="flex flex-col gap-3 text-sm bg-muted/30 p-3 rounded-md border border-border/50">
              {client.website && (
                <a
                  href={
                    client.website.startsWith('http') ? client.website : `https://${client.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" /> {client.website}
                </a>
              )}
              {client.instagram && (
                <a
                  href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-pink-600 hover:underline"
                >
                  <Instagram className="h-4 w-4" /> {client.instagram}
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
                  className="flex items-center gap-2 text-blue-800 hover:underline"
                >
                  <Facebook className="h-4 w-4" /> {client.facebook}
                </a>
              )}
              {!client.website && !client.instagram && !client.facebook && (
                <p className="text-muted-foreground italic">Nenhuma rede social informada</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
