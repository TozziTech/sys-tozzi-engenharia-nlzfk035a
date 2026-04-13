import { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { uploadTaskAttachments, deleteTaskAttachment } from '@/services/tasks'
import pb from '@/lib/pocketbase/client'
import { FilePreviewModal, PreviewFile } from './FilePreviewModal'

interface TaskAttachmentsProps {
  taskId: string
  attachments: string[]
  onUpdate: (updatedTask: any) => void
}

export function TaskAttachments({ taskId, attachments, onUpdate }: TaskAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getFileUrl = (filename: string) => `${pb.baseUrl}/api/files/tasks/${taskId}/${filename}`

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
    )
    if (validFiles.length !== files.length) {
      toast({
        title: 'Aviso',
        description: 'Alguns arquivos foram ignorados. Apenas imagens e PDFs são permitidos.',
        variant: 'destructive',
      })
    }
    if (validFiles.length === 0) return

    setIsUploading(true)
    try {
      const updatedTask = await uploadTaskAttachments(taskId, validFiles)
      onUpdate(updatedTask)
      toast({ title: 'Sucesso', description: 'Arquivos anexados com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao enviar arquivos.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      const updatedTask = await deleteTaskAttachment(taskId, filename)
      onUpdate(updatedTask)
      toast({ title: 'Sucesso', description: 'Anexo removido.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao remover anexo.', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-muted-foreground/25 hover:bg-muted/50',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files))
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*,application/pdf"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(Array.from(e.target.files))
          }}
        />
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        ) : (
          <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
        )}
        <p className="text-sm font-medium">
          {isUploading ? 'Enviando...' : 'Arraste e solte arquivos aqui'}
        </p>
        <p className="text-xs text-muted-foreground">ou clique para selecionar (Imagens e PDFs)</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {attachments.map((filename) => {
          const isPdf = filename.toLowerCase().endsWith('.pdf')
          const Icon = isPdf ? FileText : ImageIcon
          const url = getFileUrl(filename)

          return (
            <div
              key={filename}
              className="flex items-center justify-between p-3 bg-muted rounded-lg group border border-transparent hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-background rounded-md shadow-sm">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm truncate font-medium" title={filename}>
                  {filename}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-background"
                  onClick={() =>
                    setPreviewFile({ url, name: filename, type: isPdf ? 'pdf' : 'image' })
                  }
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(filename)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
        {attachments.length === 0 && !isUploading && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum anexo encontrado</p>
          </div>
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  )
}
