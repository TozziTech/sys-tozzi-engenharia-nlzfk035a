import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import useProjectStore from '@/stores/useProjectStore'
import { createProjectModule, updateProjectModule } from '@/services/project_modules'
import { ProjectModule, SUB_DISCIPLINES_LIST } from '@/types/project_modules'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { addDays, format, parseISO } from 'date-fns'

const DISCIPLINES = [
  'Estrutural Concreto',
  'Estrutural Metálico',
  'Fundação/Contenção',
  'Hidráulico',
  'Elétrico',
  'Engenharia Diagnóstico',
  'Prevenção de Incêndio',
  'Gases',
  'Orçamento',
  'Ensaios',
  'Recuperação e Reforço',
  'Consultoria',
  'Climatização',
  'Arquitetura e Regularização',
  'Assistência Técnica',
  'Auditoria',
]

const schema = z.object({
  name: z.string().min(1, 'Disciplina é obrigatória'),
  status: z.enum(['Pendente', 'Em Andamento', 'Concluído', 'Pausado', 'Em Análise', 'Em Revisão']),
  progress: z.coerce.number().min(0).max(100),
  deadline_days: z.coerce.number().min(0).optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  responsible: z.string().optional(),
  designer: z.string().optional(),
  sub_disciplines: z.array(z.string()).optional(),
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
  const { users, projects } = useProjectStore()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subDisciplineSearch, setSubDisciplineSearch] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      status: 'Pendente',
      progress: 0,
      deadline_days: 0,
      deadline: '',
      notes: '',
      sub_disciplines: [],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (module) {
        form.reset({
          name: module.name,
          status: module.status,
          progress: module.progress,
          deadline_days: module.deadline_days || 0,
          deadline: module.deadline ? new Date(module.deadline).toISOString().split('T')[0] : '',
          notes: module.notes || '',
          responsible: module.responsible || 'none',
          designer: module.designer || 'none',
          sub_disciplines: module.sub_disciplines || [],
        })
      } else {
        form.reset({
          name: '',
          status: 'Pendente',
          progress: 0,
          deadline_days: 0,
          deadline: '',
          notes: '',
          responsible: 'none',
          designer: 'none',
          sub_disciplines: [],
        })
      }
      setSubDisciplineSearch('')
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
        deadline_days: data.deadline_days || 0,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : '',
        responsible: data.responsible !== 'none' ? data.responsible : null,
        designer: data.designer !== 'none' ? data.designer : null,
        sub_disciplines: data.sub_disciplines || [],
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module ? 'Editar Disciplina' : 'Adicionar Disciplina'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCIPLINES.map((discipline) => (
                          <SelectItem key={discipline} value={discipline}>
                            {discipline}
                          </SelectItem>
                        ))}
                        {field.value && !DISCIPLINES.includes(field.value) && (
                          <SelectItem value={field.value}>{field.value} (Legado)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sub_disciplines"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Sub-disciplinas</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between font-normal h-10',
                              !field.value?.length && 'text-muted-foreground',
                            )}
                          >
                            <span className="truncate">
                              {field.value?.length
                                ? `${field.value.length} selecionada(s)`
                                : 'Selecione ou crie...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] sm:w-[450px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar ou criar sub-disciplina..."
                            value={subDisciplineSearch}
                            onValueChange={setSubDisciplineSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
                            <CommandGroup>
                              {Array.from(
                                new Set([...SUB_DISCIPLINES_LIST, ...(field.value || [])]),
                              ).map((sd) => (
                                <CommandItem
                                  key={sd}
                                  value={sd}
                                  onSelect={() => {
                                    const current = field.value || []
                                    const updated = current.includes(sd)
                                      ? current.filter((c) => c !== sd)
                                      : [...current, sd]
                                    field.onChange(updated)
                                    setSubDisciplineSearch('')
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value?.includes(sd) ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {sd}
                                </CommandItem>
                              ))}
                              {subDisciplineSearch &&
                                !SUB_DISCIPLINES_LIST.some(
                                  (sd) => sd.toLowerCase() === subDisciplineSearch.toLowerCase(),
                                ) &&
                                !field.value?.some(
                                  (sd) => sd.toLowerCase() === subDisciplineSearch.toLowerCase(),
                                ) && (
                                  <CommandItem
                                    value={subDisciplineSearch}
                                    onSelect={() => {
                                      const current = field.value || []
                                      field.onChange([...current, subDisciplineSearch])
                                      setSubDisciplineSearch('')
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar "{subDisciplineSearch}"
                                  </CommandItem>
                                )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((sd) => (
                          <Badge
                            key={sd}
                            variant="secondary"
                            className="text-xs font-normal pr-1.5 mb-1"
                          >
                            {sd}
                            <button
                              type="button"
                              className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
                              onClick={() => field.onChange(field.value?.filter((v) => v !== sd))}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          const days = parseInt(e.target.value, 10)
                          if (!isNaN(days)) {
                            const p = projects.find((p) => p.id === projectId)
                            const start = p?.startDate ? parseISO(p.startDate) : new Date()
                            const newDate = addDays(start, days)
                            form.setValue('deadline', format(newDate, 'yyyy-MM-dd'))
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Em Revisão">Em Revisão</SelectItem>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {users.filter(
                          (u) =>
                            (u.status === 'Ativo' &&
                              ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                u.role,
                              )) ||
                            u.id === module?.responsible,
                        ).length === 0 && (
                          <SelectItem value="none_disabled" disabled>
                            Nenhum responsável disponível
                          </SelectItem>
                        )}
                        {users
                          .filter(
                            (u) =>
                              (u.status === 'Ativo' &&
                                ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                  u.role,
                                )) ||
                              u.id === module?.responsible,
                          )
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.codigo || 'Usuário sem nome'}{' '}
                              {u.email ? `(${u.email})` : ''}
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
                name="designer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projetista (Designer)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projetista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {users.filter(
                          (u) =>
                            (u.status === 'Ativo' && u.role === 'Projetista') ||
                            u.id === module?.designer,
                        ).length === 0 && (
                          <SelectItem value="none_disabled" disabled>
                            Nenhum projetista disponível
                          </SelectItem>
                        )}
                        {users
                          .filter(
                            (u) =>
                              (u.status === 'Ativo' && u.role === 'Projetista') ||
                              u.id === module?.designer,
                          )
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.codigo || 'Usuário sem nome'}{' '}
                              {u.email ? `(${u.email})` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
