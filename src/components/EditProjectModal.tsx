import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { DatePicker } from './DatePicker'
import useProjectStore from '@/stores/useProjectStore'
import type { Discipline, Project, Status } from '@/types/project'
import { useToast } from '@/hooks/use-toast'

const formSchema = z
  .object({
    name: z.string().min(1, 'Obrigatório'),
    description: z.string().optional(),
    discipline: z.string().min(1, 'Obrigatório'),
    client: z.string().min(1, 'Obrigatório'),
    status: z.string().min(1, 'Obrigatório'),
    startDate: z.date({ required_error: 'Obrigatório' }),
    endDate: z.date({ required_error: 'Obrigatório' }),
    engineer: z.string().min(1, 'Obrigatório'),
    budget: z
      .string()
      .transform((v) => (v === '' ? undefined : Number(v)))
      .optional(),
    spent: z
      .string()
      .transform((v) => (v === '' ? undefined : Number(v)))
      .optional(),
    progress: z
      .string()
      .transform((v) => (v === '' ? 0 : Number(v)))
      .optional(),
    observations: z.string().optional(),
    cno: z.string().optional(),
    cnpj: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Data de entrega deve ser posterior ao início',
    path: ['endDate'],
  })

const ENGINEERS = ['Eng. Ricardo Silva', 'Eng. Maria Santos', 'Eng. Carlos Oliveira']
const DISCIPLINES = [
  'Estrutural',
  'Hidrossanitário',
  'Elétrico',
  'Prevenção a Incêndio',
  'AVAC',
  'Gás',
  'Infraestrutura',
  'Arquitetura',
  'Geotecnia',
  'Ambiental',
  'Telecomunicações',
  'Design de Interiores',
  'Luminotécnica',
]
const STATUSES = ['Planejamento', 'Em Andamento', 'Concluído', 'Atrasado']

interface EditProjectModalProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const { updateProject } = useProjectStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      discipline: '',
      client: '',
      status: '',
      engineer: '',
      observations: '',
      budget: undefined,
      spent: undefined,
      progress: 0,
      cno: '',
      cnpj: '',
    },
  })

  useEffect(() => {
    if (open && project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        discipline: project.discipline,
        client: project.client,
        status: project.status,
        engineer: project.engineer,
        observations: project.observations || '',
        budget: project.budget !== undefined ? (String(project.budget) as any) : undefined,
        spent: project.spent !== undefined ? (String(project.spent) as any) : undefined,
        progress: String(project.progress) as any,
        startDate: new Date(project.startDate + 'T00:00:00'),
        endDate: new Date(project.endDate + 'T00:00:00'),
        cno: project.cno || '',
        cnpj: project.cnpj || '',
      })
    }
  }, [open, project, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateProject(project.id, {
      name: values.name,
      description: values.description,
      client: values.client,
      discipline: values.discipline as Discipline,
      status: values.status as Status,
      startDate: values.startDate.toISOString().split('T')[0],
      endDate: values.endDate.toISOString().split('T')[0],
      progress: values.progress || 0,
      engineer: values.engineer,
      budget: values.budget,
      spent: values.spent,
      observations: values.observations,
      cno: values.cno,
      cnpj: values.cnpj,
    })

    toast({
      title: 'Projeto atualizado!',
      description: `As alterações em ${values.name} foram salvas localmente. Os dados serão resetados ao recarregar a página.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl">Editar Projeto</DialogTitle>
              <DialogDescription>Atualize as informações do projeto abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Edifício Aurora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Construtora Alfa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discipline"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Disciplina</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCIPLINES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="engineer"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Engenheiro Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENGINEERS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
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
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Progresso (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ex: 50"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        label="Data de Início"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Data de Entrega</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        label="Data de Entrega"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Orçamento Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 50000"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spent"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Valor Gasto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 25000"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cno"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>CNO da Obra</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>CNPJ da Obra</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Breve descrição do projeto..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionais..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
