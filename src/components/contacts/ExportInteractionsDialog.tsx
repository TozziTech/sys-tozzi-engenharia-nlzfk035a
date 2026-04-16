import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { type Contact } from '@/services/contacts'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ContactInteraction } from '@/services/contact_interactions'

const escapeCSV = (str: string | undefined | null | number) => {
  if (str === null || str === undefined || str === '') return '""'
  const clean = String(str).replace(/"/g, '""')
  return `"${clean}"`
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

interface ExportInteractionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  initialContactId?: string | null
}

export function ExportInteractionsDialog({
  open,
  onOpenChange,
  contacts,
  initialContactId,
}: ExportInteractionsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedContact, setSelectedContact] = useState<string>('all')

  useEffect(() => {
    if (open) {
      setStartDate('')
      setEndDate('')
      setSelectedContact(initialContactId || 'all')
    }
  }, [open, initialContactId])

  const handleExport = async () => {
    setLoading(true)
    try {
      const filters: string[] = []

      if (startDate) {
        const [year, month, day] = startDate.split('-')
        const startLocal = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0)
        filters.push(`interaction_date >= "${startLocal.toISOString().replace('T', ' ')}"`)
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-')
        const endLocal = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          23,
          59,
          59,
          999,
        )
        filters.push(`interaction_date <= "${endLocal.toISOString().replace('T', ' ')}"`)
      }
      if (selectedContact && selectedContact !== 'all') {
        filters.push(`contact = "${selectedContact}"`)
      }

      const queryFilter = filters.length > 0 ? filters.join(' && ') : ''

      const records = await pb.collection('contact_interactions').getFullList<ContactInteraction>({
        filter: queryFilter,
        expand: 'user,contact',
        sort: '-interaction_date,-created',
      })

      if (records.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'Não há interações registradas para os filtros selecionados.',
        })
        setLoading(false)
        return
      }

      const headers = [
        'Data da Interação',
        'Código do Contato',
        'Nome do Contato',
        'Autor',
        'Conteúdo/Nota',
      ]

      const rows = records.map((i) => {
        const date = i.interaction_date || i.created
        const formattedDate = date ? new Date(date).toLocaleString('pt-BR') : ''
        return [
          escapeCSV(formattedDate),
          escapeCSV(i.expand?.contact?.code || ''),
          escapeCSV(i.expand?.contact?.name || ''),
          escapeCSV(i.expand?.user?.name || ''),
          escapeCSV(i.content || ''),
        ].join(';')
      })

      const csvContent = [headers.join(';'), ...rows].join('\n')

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')

      downloadCSV(csvContent, `relatorio_interacoes_${yyyy}-${mm}-${dd}.csv`)

      toast({
        title: 'Sucesso',
        description: 'Relatório exportado com sucesso.',
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro na exportação',
        description: 'Ocorreu um erro ao gerar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Histórico</DialogTitle>
          <DialogDescription>
            Configure os filtros abaixo para exportar um relatório em CSV das interações e notas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contato</Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Contatos</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.code ? `${contact.code} - ` : ''}
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
