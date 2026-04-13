import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export interface PreviewFile {
  url: string
  name: string
  type: 'image' | 'pdf'
}

interface FilePreviewModalProps {
  file: PreviewFile | null
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="truncate pr-8">{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30 flex items-center justify-center p-4">
          {file.type === 'image' && (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-md"
            />
          )}
          {file.type === 'pdf' && (
            <iframe
              src={file.url}
              className="w-full h-full rounded-md border bg-background"
              title={file.name}
            />
          )}
        </div>
        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}>
              <Download className="w-4 h-4 mr-2" /> Baixar Original
            </a>
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
