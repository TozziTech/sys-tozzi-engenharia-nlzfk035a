import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/RichTextEditor'
import {
  ContractClause,
  createContractClause,
  updateContractClause,
} from '@/services/contract_clauses'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface Props {
  clause?: ContractClause
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClauseEditorDialog({ clause, open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setName(clause?.name || '')
      setCategory(clause?.category || '')
      setContent(clause?.content || '')
      setErrors({})
    }
  }, [clause, open])

  const handleSave = async () => {
    if (!name) return setErrors({ name: 'Nome é obrigatório' })
    if (!content || content === '<p><br></p>')
      return setErrors({ content: 'Conteúdo é obrigatório' })

    setLoading(true)
    try {
      if (clause) {
        await updateContractClause(clause.id, { name, category, content })
        toast.success('Cláusula atualizada')
      } else {
        await createContractClause({ name, category, content })
        toast.success('Cláusula criada')
      }
      onOpenChange(false)
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast.error('Erro ao salvar cláusula')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{clause ? 'Editar Cláusula' : 'Nova Cláusula'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome da Cláusula</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Foro de Eleição"
              />
              {errors.name && <span className="text-xs text-destructive">{errors.name}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria (Opcional)</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Jurídico"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Conteúdo</Label>
            <RichTextEditor value={content} onChange={setContent} className="min-h-[250px]" />
            {errors.content && <span className="text-xs text-destructive">{errors.content}</span>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
