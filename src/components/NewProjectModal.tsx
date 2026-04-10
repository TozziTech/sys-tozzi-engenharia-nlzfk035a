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
import { Discipline } from '@/types/project'
import { useToast } from '@/hooks/use-toast'

const formSchema = z
  .object({
    name: z.string().min(1, 'Obrigatório'),
    description: z.string().optional(),
    discipline: z.string().min(1, 'Obrigatório'),
    client: z.string().min(1, 'Obrigatório'),
    startDate: z.date({ required_error: 'Obrigatório' }),
    endDate: z.date({ required_error: 'Obrigatório' }),
    engineer: z.string().min(1, 'Obrigatório'),
    budget: z
      .string()
      .transform((v) => (v === '' ? undefined : Number(v)))
      .optional(),
    observations: z.string().optional(),
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

export function NewProjectModal() {
  const { isNewProjectModalOpen, setNewProjectModalOpen, addProject } = useProjectStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      discipline: '',
      client: '',
      engineer: '',
      observations: '',
      budget: undefined,
    },
  })

  useEffect(() => {
    if (isNewProjectModalOpen) form.reset()
  }, [isNewProjectModalOpen, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addProject({
      id: Math.random().toString(36).substring(7),
      name: values.name,
      description: values.description,
      client: values.client,
      discipline: values.discipline as Discipline,
      status: 'Planejamento',
      startDate: values.startDate.toISOString().split('T')[0],
      endDate: values.endDate.toISOString().split('T')[0],
      progress: 0,
      engineer: values.engineer,
      budget: values.budget,
      observations: values.observations,
    })

    toast({ title: 'Projeto criado!', description: `O projeto ${values.name} foi adicionado.` })
    setNewProjectModalOpen(false)
  }

  return (
    <Dialog open={isNewProjectModalOpen} onOpenChange={setNewProjectModalOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-xl">Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo para adicionar um novo projeto ao painel.
              </DialogDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="engineer"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Engenheiro Responsável</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <div className="col-span-2 sm:col-span-1" />
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
              <Button type="button" variant="ghost" onClick={() => setNewProjectModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
