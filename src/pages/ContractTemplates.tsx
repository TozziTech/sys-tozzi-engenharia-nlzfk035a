import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  ContractTemplate,
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
} from '@/services/contract_templates'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const templateSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  content: z.string().min(10, 'O conteúdo do contrato não pode ficar vazio.'),
})

export default function ContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', content: '' },
  })

  const loadTemplates = async () => {
    try {
      const data = await getContractTemplates()
      setTemplates(data)
    } catch (error) {
      toast.error('Erro ao carregar modelos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  useRealtime('contract_templates', () => {
    loadTemplates()
  })

  const handleOpen = (template?: ContractTemplate) => {
    if (template) {
      setEditingId(template.id)
      form.reset({ name: template.name, content: template.content })
    } else {
      setEditingId(null)
      form.reset({ name: '', content: '' })
    }
    setIsOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    try {
      if (editingId) {
        await updateContractTemplate(editingId, values)
        toast.success('Modelo atualizado com sucesso!')
      } else {
        await createContractTemplate(values)
        toast.success('Modelo criado com sucesso!')
      }
      setIsOpen(false)
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (fieldErrors.name) {
        form.setError('name', { message: 'Já existe um modelo com este nome.' })
      } else {
        toast.error('Erro ao salvar o modelo.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      try {
        await deleteContractTemplate(id)
        toast.success('Modelo excluído.')
      } catch {
        toast.error('Erro ao excluir o modelo.')
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos de Contrato</h1>
          <p className="text-muted-foreground">Gerencie os templates de documentos e contratos.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Modelo' : 'Criar Novo Modelo'}</DialogTitle>
              <DialogDescription>
                Use as variáveis para campos dinâmicos: <code>{'{{cliente}}'}</code>,{' '}
                <code>{'{{endereco}}'}</code>, <code>{'{{valor}}'}</code>,{' '}
                <code>{'{{prazo}}'}</code>.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Contrato de Prestação de Serviços" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo do Contrato</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite o conteúdo do contrato aqui..."
                          className="min-h-[300px] font-mono resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        O conteúdo será substituído com os dados reais ao gerar o contrato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Modelo</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Modelo</TableHead>
              <TableHead className="w-[200px]">Última Atualização</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Carregando modelos...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Nenhum modelo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{new Date(template.updated).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(template)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
