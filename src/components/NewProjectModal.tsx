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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePicker } from './DatePicker'
import { ClientCombobox } from './ClientCombobox'
import { EngineerCombobox } from './EngineerCombobox'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'
import type { Project } from '@/types/project'

const formSchema = z
  .object({
    name: z.string().min(1, 'Obrigatório'),
    client: z.string().min(1, 'Obrigatório'),
    startDate: z.date({ required_error: 'Obrigatório' }),
    endDate: z.date({ required_error: 'Obrigatório' }),
    engineer: z.string().min(1, 'Obrigatório'),
    budget: z.string().optional(),
    cno: z.string().optional(),
    cnpj_obra: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Data de entrega deve ser posterior ao início',
    path: ['endDate'],
  })

export function NewProjectModal() {
  const { isNewProjectModalOpen, setNewProjectModalOpen, addProject } = useProjectStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      client: '',
      engineer: '',
      budget: '',
      cno: '',
      cnpj_obra: '',
    },
  })

  useEffect(() => {
    if (isNewProjectModalOpen) form.reset()
  }, [isNewProjectModalOpen, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const budgetValue = values.budget
      ? Number(values.budget.replace(/\./g, '').replace(',', '.'))
      : undefined

    addProject({
      id: Math.random().toString(36).substring(7),
      name: values.name,
      client: values.client,
      status: 'Planejamento',
      startDate: values.startDate.toISOString().split('T')[0],
      endDate: values.endDate.toISOString().split('T')[0],
      progress: 0,
      engineer: values.engineer,
      budget: budgetValue,
      cno: values.cno,
      cnpj_obra: values.cnpj_obra,
      cnpj: values.cnpj_obra,
    } as Project)

    toast({ title: 'Projeto criado!', description: `O projeto ${values.name} foi adicionado.` })
    setNewProjectModalOpen(false)
  }

  const formatCurrency = (val: string) => {
    const onlyNums = val.replace(/\D/g, '')
    if (!onlyNums) return ''
    const num = (parseInt(onlyNums, 10) / 100).toFixed(2)
    return num.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
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
                      <ClientCombobox value={field.value} onChange={field.onChange} />
                    </FormControl>
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
                    <FormControl>
                      <EngineerCombobox value={field.value} onChange={field.onChange} />
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
                    <FormLabel>Valor de Contrato (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 50.000,00"
                        value={field.value}
                        onChange={(e) => field.onChange(formatCurrency(e.target.value))}
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
                name="cnpj_obra"
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
