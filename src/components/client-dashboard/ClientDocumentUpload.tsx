import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, UploadCloud } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ClientDocumentUploadProps {
  projectId: string
  parentId?: string
  isVersion?: boolean
  defaultCategory?: string
  defaultType?: string
  trigger?: React.ReactNode
}

export function ClientDocumentUpload({
  projectId,
  parentId,
  isVersion = false,
  defaultCategory = 'Outros',
  defaultType = 'Outros',
  trigger,
}: ClientDocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState(defaultType)
  const [categoria, setCategoria] = useState(defaultCategory)
  const [versionLabel, setVersionLabel] = useState(isVersion ? '' : 'v1')
  const [versionNotes, setVersionNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file) return

    if (file.size > 104857600) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho do arquivo não pode exceder 100MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('projeto_id', projectId)
      formData.append('nome_arquivo', file.name)
      formData.append('tipo', isVersion ? defaultType : type)
      formData.append('categoria', isVersion ? defaultCategory : categoria)
      formData.append('arquivo', file)

      if (parentId) formData.append('parent_id', parentId)
      if (versionLabel) formData.append('version_label', versionLabel)
      if (versionNotes) formData.append('version_notes', versionNotes)

      await pb.collection('documentos_projeto').create(formData)

      toast({
        title: 'Sucesso',
        description: isVersion
          ? 'Nova versão enviada com sucesso!'
          : 'Documento enviado com sucesso!',
      })
      setIsOpen(false)
      setFile(null)
      setType(defaultType)
      setCategoria(defaultCategory)
      setVersionLabel(isVersion ? '' : 'v1')
      setVersionNotes('')
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Ocorreu um erro no envio do documento.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button size="sm" variant="outline" className="gap-2 h-8">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isVersion ? 'Enviar Nova Versão' : 'Enviar Documento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Arquivo</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
              {file ? (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-primary truncate max-w-full px-4">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-sm text-muted-foreground text-center">
                    Clique para selecionar um arquivo
                  </span>
                  <span className="text-xs text-muted-foreground/70 mt-1">
                    Tamanho máximo: 100MB
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {!isVersion && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Documento</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prancha">Prancha</SelectItem>
                    <SelectItem value="Relatório">Relatório</SelectItem>
                    <SelectItem value="Contrato">Contrato</SelectItem>
                    <SelectItem value="Memorial">Memorial</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                    <SelectItem value="Engenharia">Engenharia</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Relatórios">Relatórios</SelectItem>
                    <SelectItem value="Contratos">Contratos</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Rótulo da Versão {!isVersion && '(Opcional)'}</Label>
            <Input
              placeholder={isVersion ? 'Ex: v2, Revisão Final' : 'Ex: v1'}
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
            />
          </div>

          {isVersion && (
            <div className="grid gap-2">
              <Label>Notas da Versão (Opcional)</Label>
              <Textarea
                placeholder="O que mudou nesta versão?"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
