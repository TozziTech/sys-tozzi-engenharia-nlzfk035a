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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const templateSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres.'),
  content: z.string().min(10, 'Conteúdo obrigatório.'),
  email_subject: z.string().optional(),
  email_body: z.string().optional(),
})

export function TemplatesTab() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', content: '', email_subject: '', email_body: '' },
  })

  const loadTemplates = async () => {
    try {
      const data = await getContractTemplates()
      setTemplates(data)
    } catch {
      toast.error('Erro ao carregar modelos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])
  useRealtime('contract_templates', () => loadTemplates())

  const handleOpen = (t?: ContractTemplate) => {
    if (t) {
      setEditingId(t.id)
      form.reset({
        name: t.name,
        content: t.content,
        email_subject: t.email_subject || '',
        email_body: t.email_body || '',
      })
    } else {
      setEditingId(null)
      form.reset({ name: '', content: '', email_subject: '', email_body: '' })
    }
    setIsOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    try {
      if (editingId) await updateContractTemplate(editingId, values)
      else await createContractTemplate(values)
      toast.success('Modelo salvo com sucesso!')
      setIsOpen(false)
    } catch {
      toast.error('Erro ao salvar o modelo.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este modelo?')) {
      try {
        await deleteContractTemplate(id)
        toast.success('Modelo excluído.')
      } catch {
        toast.error('Erro ao excluir.')
      }
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle>
              <DialogDescription>
                Use variáveis: {'{{cliente}}'}, {'{{endereco}}'}, {'{{valor}}'}, {'{{prazo}}'}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea className="min-h-[200px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="email_subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto do E-mail</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email_body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corpo do E-mail</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[200px]">Atualizado em</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum modelo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{new Date(t.updated).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpen(t)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
