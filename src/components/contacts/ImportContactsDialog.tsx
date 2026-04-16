import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

interface ImportContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportContactsDialog({ open, onOpenChange, onSuccess }: ImportContactsDialogProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!file) return
    setLoading(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados.')

      const separator = lines[0].includes(';') ? ';' : ','
      const headers = lines[0]
        .split(separator)
        .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())

      const getIndex = (possibleNames: string[]) => {
        return headers.findIndex((h) => possibleNames.some((p) => h.includes(p)))
      }

      const colCode = getIndex(['código', 'codigo', 'code'])
      const colName = getIndex(['nome', 'name'])
      const colCompany = getIndex(['empresa', 'company'])
      const colPhone = getIndex(['telefone', 'phone', 'celular'])
      const colAltPhone = getIndex(['telefone alternativo', 'alt_phone', 'telefone 2'])
      const colEmail = getIndex(['email', 'e-mail'])
      const colCategory = getIndex(['categoria', 'category'])
      const colAddress = getIndex(['endereço', 'endereco', 'address'])
      const colNotes = getIndex(['observações', 'observacoes', 'notes'])

      if (colName === -1 || colCode === -1 || colCategory === -1) {
        throw new Error('As colunas Código, Nome e Categoria são obrigatórias.')
      }

      let successCount = 0
      let errorCount = 0

      const existingContacts = await pb.collection('contacts').getFullList({ fields: 'id,code' })
      const codeToId = new Map(existingContacts.map((c) => [c.code, c.id]))

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        const row = parseCSVRow(line, separator)
        if (row.length === 0) continue

        const code = row[colCode] || ''
        const name = row[colName] || ''
        const category = row[colCategory] || 'Cliente'

        if (!code || !name) {
          errorCount++
          continue
        }

        const payload = {
          code,
          name,
          company: colCompany !== -1 ? row[colCompany] : '',
          phone: colPhone !== -1 ? row[colPhone] : '',
          alt_phone: colAltPhone !== -1 ? row[colAltPhone] : '',
          email: colEmail !== -1 ? row[colEmail] : '',
          category,
          address: colAddress !== -1 ? row[colAddress] : '',
          notes: colNotes !== -1 ? row[colNotes] : '',
        }

        try {
          const existingId = codeToId.get(code)
          if (existingId) {
            await pb.collection('contacts').update(existingId, payload)
          } else {
            await pb.collection('contacts').create(payload)
          }
          successCount++
        } catch (e) {
          errorCount++
        }
      }

      toast({
        title: 'Importação concluída',
        description: `${successCount} registros salvos. ${errorCount} erros.`,
      })
      onSuccess()
      onOpenChange(false)
      setFile(null)
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Verifique o formato do arquivo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const parseCSVRow = (text: string, separator: string) => {
    const re = new RegExp(`(?:^|${separator})("(?:[^"]|"")*"|[^${separator}]*)`, 'g')
    const result = []
    let match
    while ((match = re.exec(text)) !== null) {
      let val = match[1]
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"')
      }
      result.push(val)
    }
    return result
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV contendo os contatos. As colunas obrigatórias são: Código, Nome
            e Categoria. Registros com códigos existentes serão atualizados.
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
          <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
