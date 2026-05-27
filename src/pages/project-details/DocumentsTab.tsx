import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function DocumentsTab({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<any[]>([])

  const load = () => {
    pb.collection('project_documents')
      .getFullList({ filter: `project="${projectId}"`, sort: '-created' })
      .then(setDocs)
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [projectId])

  useRealtime('project_documents', (e) => {
    if (e.record.project === projectId) load()
  })

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome do Arquivo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data de Envio</TableHead>
            <TableHead className="text-right">Download</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{d.type}</TableCell>
              <TableCell>{new Date(d.created).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-right">
                {d.file && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={pb.files.getURL(d, d.file)} target="_blank" rel="noreferrer" download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {docs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum documento anexado a este projeto.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
