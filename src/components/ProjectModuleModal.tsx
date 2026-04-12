import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { createProjectModule, updateProjectModule } from '@/services/project_modules'
import { ProjectModule } from '@/types/project_modules'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  status: z.enum(['Pendente', 'Em Andamento', 'Concluído', 'Pausado']),
  progress: z.coerce.number().min(0).max(100),
  deadline: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ProjectModuleModal({
  isOpen,
  onClose,
  projectId,
  module,
}: {
  isOpen: boolean
  onClose: () => void
  projectId: string
  module?: ProjectModule
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      status: 'Pendente',
      progress: 0,
      deadline: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (module) {
        form.reset({
          name: module.name,
          status: module.status,
          progress: module.progress,
          deadline: module.deadline ? new Date(module.deadline).toISOString().split('T')[0] : '',
          notes: module.notes || '',
        })
      } else {
        form.reset({
          name: '',
          status: 'Pendente',
          progress: 0,
          deadline: '',
          notes: '',
        })
      }
    }
  }, [isOpen, module, form])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const payload: any = {
        name: data.name,
        status: data.status,
        progress: data.progress,
        notes: data.notes,
        project: projectId,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : '',
      }

      if (module) {
        await updateProjectModule(module.id, payload, user.id)
        toast({ title: 'Disciplina atualizada' })
      } else {
        await createProjectModule(payload, user.id)
        toast({ title: 'Disciplina criada' })
      }
      onClose()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a disciplina',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{module ? 'Editar Disciplina' : 'Adicionar Disciplina'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Disciplina</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Projeto Estrutural" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Pausado">Pausado</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progresso (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo de Entrega</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Técnicas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
