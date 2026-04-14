import { useEffect } from 'react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  createDocumentResource,
  updateDocumentResource,
  DocumentResource,
} from '@/services/document_resources'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: DocumentResource | null
  category: string
  onSuccess: () => void
}

export function DocumentResourceDialog({
  open,
  onOpenChange,
  resource,
  category,
  onSuccess,
}: Props) {
  const { toast } = useToast()
  const isEditing = !!resource

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (resource) {
        form.reset({
          title: resource.title,
          description: resource.description || '',
          url: resource.url,
        })
      } else {
        form.reset({
          title: '',
          description: '',
          url: '',
        })
      }
    }
  }, [open, resource, form])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && resource) {
        await updateDocumentResource(resource.id, data)
        toast({ title: 'Documento atualizado com sucesso' })
      } else {
        await createDocumentResource({ ...data, category })
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere os detalhes do documento abaixo.'
              : `Adicione um novo documento para a seção ${category}.`}
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
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Externo (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." type="url" {...field} />
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
