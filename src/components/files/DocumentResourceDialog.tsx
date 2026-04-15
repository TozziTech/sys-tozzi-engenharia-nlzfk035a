import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  createDocumentResource,
  updateDocumentResource,
  DocumentResource,
} from '@/services/document_resources'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getContrastYIQ } from '@/lib/colors'
import { ManageTagsDialog } from '@/components/ManageTagsDialog'
import { Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  url: z
    .string()
    .min(1, 'URL é obrigatória')
    .refine((val) => {
      try {
        new URL(/^https?:\/\//i.test(val) ? val : `https://${val}`)
        return true
      } catch {
        return false
      }
    }, 'URL inválida'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  discipline: z.string().optional(),
  is_suggested_video: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: DocumentResource | null
  category: string
  onSuccess: () => void
  prefillDiscipline?: string
}

export function DocumentResourceDialog({
  open,
  onOpenChange,
  resource,
  category,
  onSuccess,
  prefillDiscipline,
}: Props) {
  const { toast } = useToast()
  const isEditing = !!resource
  const [availableTags, setAvailableTags] = useState<any[]>([])

  const loadTags = () => {
    pb.collection('tags').getFullList({ sort: 'name' }).then(setAvailableTags).catch(console.error)
  }

  useEffect(() => {
    loadTags()
  }, [])

  useRealtime('tags', loadTags, open)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      category: category,
      discipline: '',
      is_suggested_video: false,
      tags: [],
    },
  })

  useEffect(() => {
    if (open) {
      if (resource) {
        form.reset({
          title: resource.title,
          description: resource.description || '',
          url: resource.url,
          category: resource.category || category,
          discipline: resource.discipline || '',
          is_suggested_video: resource.is_suggested_video || false,
          tags: resource.tags || [],
        })
      } else {
        form.reset({
          title: '',
          description: '',
          url: '',
          category: category,
          discipline: prefillDiscipline || '',
          is_suggested_video: false,
          tags: [],
        })
      }
    }
  }, [open, resource, form, category, prefillDiscipline])

  const onSubmit = async (data: FormData) => {
    try {
      const normalizedData = {
        ...data,
        url: /^https?:\/\//i.test(data.url) ? data.url : `https://${data.url}`,
      }

      if (isEditing && resource) {
        await updateDocumentResource(resource.id, normalizedData)
        toast({ title: 'Documento atualizado com sucesso' })
      } else {
        await createDocumentResource(normalizedData)
        toast({ title: 'Documento adicionado com sucesso' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast({ title: 'Erro ao salvar documento', variant: 'destructive' })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes do documento abaixo.' : `Adicione um novo documento.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Manual Técnico..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                      <SelectItem value="POPs">POPs</SelectItem>
                      <SelectItem value="Projetos Base">Projetos Base</SelectItem>
                      <SelectItem value="Documentos Modelos">Documentos Modelos</SelectItem>
                      <SelectItem value="Cursos">Cursos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discipline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplina (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Concreto Armado">Concreto Armado</SelectItem>
                      <SelectItem value="Metálico">Metálico</SelectItem>
                      <SelectItem value="Hidrossanitário">Hidrossanitário</SelectItem>
                      <SelectItem value="Elétrico">Elétrico</SelectItem>
                      <SelectItem value="Prevenção de Incêndio">Prevenção de Incêndio</SelectItem>
                      <SelectItem value="Gases">Gases</SelectItem>
                      <SelectItem value="Constr. Civil">Constr. Civil</SelectItem>
                      <SelectItem value="Patologia">Patologia</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('category') === 'Cursos' && (
              <FormField
                control={form.control}
                name="is_suggested_video"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Vídeo Sugerido</FormLabel>
                      <FormDescription>
                        Marque se este link for um vídeo complementar.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Externo (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="www.youtube.com/..." type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve resumo sobre o que é este documento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Tags</FormLabel>
                    <ManageTagsDialog>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2">
                        <Plus className="h-3 w-3 mr-1" /> Nova Tag
                      </Button>
                    </ManageTagsDialog>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableTags.map((tag) => {
                      const isSelected = field.value?.includes(tag.id)
                      return (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className={cn(
                            'cursor-pointer border-2 transition-all',
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-1'
                              : 'opacity-70 grayscale',
                          )}
                          style={{
                            backgroundColor: isSelected ? tag.color : 'transparent',
                            color: isSelected ? getContrastYIQ(tag.color) : 'inherit',
                            borderColor: tag.color,
                          }}
                          onClick={() => {
                            const current = field.value || []
                            const newVal = isSelected
                              ? current.filter((id) => id !== tag.id)
                              : [...current, tag.id]
                            field.onChange(newVal)
                          }}
                        >
                          {tag.name}
                        </Badge>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
