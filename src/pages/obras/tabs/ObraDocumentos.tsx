import { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileIcon } from 'lucide-react'
import { format } from 'date-fns'

export function ObraDocumentos({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<any[]>([])
  const fileInput = useRef<HTMLInputElement>(null)

  const fetchDocs = async () => {
    const data = await pb.collection('project_documents').getFullList({
      filter: `project = "${projectId}"`,
      sort: '-created',
    })
    setDocs(data)
  }

  useEffect(() => {
    fetchDocs()
  }, [projectId])
  useRealtime('project_documents', fetchDocs)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('project', projectId)
      formData.append('name', file.name)
      formData.append('file', file)
      formData.append('type', 'Other')
      await pb.collection('project_documents').create(formData)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documentos da Obra</CardTitle>
        <div>
          <input type="file" ref={fileInput} className="hidden" onChange={handleUpload} />
          <Button size="sm" className="gap-2" onClick={() => fileInput.current?.click()}>
            <Plus className="w-4 h-4" /> Enviar Arquivo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                  {doc.name}
                </TableCell>
                <TableCell>{format(new Date(doc.created), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {doc.file && (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={pb.files.getURL(doc, doc.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  Nenhum documento anexado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
