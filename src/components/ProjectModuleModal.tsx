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
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

import pb from '@/lib/pocketbase/client'

const LEGACY_HEX_COLORS: Record<string, string> = {
  'Alvenaria Estrutural': '#475569',
  Protendido: '#7c3aed',
  'Concreto Armado': '#52525b',
  Esgoto: '#d97706',
  'Água Fria': '#2563eb',
  'Água Quente': '#dc2626',
}

const schema = z.object({
  name: z.string().min(1, 'Disciplina é obrigatória'),
  status: z.enum([
    'Pendente',
    'Em Andamento',
    'Concluído',
    'Pausado',
    'Em Análise',
    'Em Revisão',
    'Em Aprovação',
  ]),
  progress: z.coerce.number().min(0).max(100),
  deadline_days: z.coerce.number().min(0).optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  edificacao: z.string().optional(),
  notes: z.string().optional(),
  responsible: z.string().optional(),
  designer: z.string().optional(),
  sub_disciplines: z.array(z.any()).optional(),
  template_id: z.string().optional(),
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
  const [tags, setTags] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    pb.collection('tags').getFullList({ sort: 'name' }).then(setTags).catch(console.error)
    pb.collection('discipline_templates')
      .getFullList({ sort: 'name' })
      .then(setTemplates)
      .catch(console.error)
  }, [])

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
      template_id: 'none',
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
          start_date: module.start_date
            ? new Date(module.start_date).toISOString().split('T')[0]
            : '',
          deadline: module.deadline ? new Date(module.deadline).toISOString().split('T')[0] : '',
          edificacao: module.edificacao || '',
          notes: module.notes || '',
          responsible: module.responsible || 'none',
          designer: module.designer || 'none',
          sub_disciplines: (module.sub_disciplines || []).map((sd: any) =>
            typeof sd === 'string' ? { name: sd, color: LEGACY_HEX_COLORS[sd] || '#3b82f6' } : sd,
          ),
          template_id: 'none',
        })
      } else {
        form.reset({
          name: '',
          status: 'Pendente',
          progress: 0,
          deadline_days: 0,
          start_date: '',
          deadline: '',
          edificacao: '',
          notes: '',
          responsible: 'none',
          designer: 'none',
          sub_disciplines: [],
          template_id: 'none',
        })
      }
      setSubDisciplineSearch('')
    }
  }, [isOpen, module, form])

  const startDateValue = form.watch('start_date')
  const deadlineDaysValue = form.watch('deadline_days')

  useEffect(() => {
    if (startDateValue && deadlineDaysValue !== undefined) {
      const days = parseInt(deadlineDaysValue.toString(), 10)
      if (!isNaN(days) && days >= 0) {
        const [year, month, day] = startDateValue.split('-').map(Number)
        if (year && month && day) {
          const start = new Date(year, month - 1, day)
          const deadlineDate = addDays(start, days)
          form.setValue('deadline', format(deadlineDate, 'yyyy-MM-dd'))
        }
      }
    }
  }, [startDateValue, deadlineDaysValue, form])

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
        edificacao: data.edificacao || '',
        start_date: data.start_date ? new Date(`${data.start_date}T12:00:00Z`).toISOString() : '',
        deadline_days: data.deadline_days || 0,
        deadline: data.deadline ? new Date(`${data.deadline}T12:00:00Z`).toISOString() : '',
        responsible: data.responsible !== 'none' ? data.responsible : null,
        designer: data.designer !== 'none' ? data.designer : null,
        sub_disciplines: data.sub_disciplines || [],
        template_id: data.template_id && data.template_id !== 'none' ? data.template_id : null,
      }

      if (module) {
        await updateProjectModule(module.id, payload, user.id)
        toast({ title: 'Sucesso', description: 'Disciplina atualizada com êxito.' })
      } else {
        await createProjectModule(payload, user.id)
        toast({ title: 'Sucesso', description: 'Disciplina criada com êxito.' })
      }

      onClose()
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as any, { type: 'manual', message })
        }
        toast({
          title: 'Erro de validação',
          description: 'Verifique os campos do formulário.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro',
          description: `Não foi possível atualizar a disciplina. ${getErrorMessage(err)}`,
          variant: 'destructive',
        })
      }
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
            {!module && (
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usar Disciplina Modelo (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (val && val !== 'none') {
                          const t = templates.find((x) => x.id === val)
                          if (t && !form.getValues('name')) {
                            form.setValue('name', t.name)
                          }
                        }
                      }}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um modelo para importar tarefas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum modelo</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.name}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </div>
                          </SelectItem>
                        ))}
                        {field.value && !tags.some((t) => t.name === field.value) && (
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
                                new Set([
                                  ...SUB_DISCIPLINES_LIST,
                                  ...(field.value || []).map((v: any) =>
                                    typeof v === 'string' ? v : v.name,
                                  ),
                                ]),
                              ).map((sdName) => {
                                const isSelected = field.value?.some(
                                  (v: any) => (typeof v === 'string' ? v : v.name) === sdName,
                                )
                                return (
                                  <CommandItem
                                    key={sdName}
                                    value={sdName}
                                    onSelect={() => {
                                      const current = field.value || []
                                      if (isSelected) {
                                        field.onChange(
                                          current.filter(
                                            (c: any) =>
                                              (typeof c === 'string' ? c : c.name) !== sdName,
                                          ),
                                        )
                                      } else {
                                        field.onChange([
                                          ...current,
                                          {
                                            name: sdName,
                                            color: LEGACY_HEX_COLORS[sdName] || '#3b82f6',
                                          },
                                        ])
                                      }
                                      setSubDisciplineSearch('')
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        isSelected ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    {sdName}
                                  </CommandItem>
                                )
                              })}
                              {subDisciplineSearch &&
                                !SUB_DISCIPLINES_LIST.some(
                                  (sd) => sd.toLowerCase() === subDisciplineSearch.toLowerCase(),
                                ) &&
                                !field.value?.some(
                                  (v: any) =>
                                    (typeof v === 'string' ? v : v.name).toLowerCase() ===
                                    subDisciplineSearch.toLowerCase(),
                                ) && (
                                  <CommandItem
                                    value={subDisciplineSearch}
                                    onSelect={() => {
                                      const current = field.value || []
                                      field.onChange([
                                        ...current,
                                        { name: subDisciplineSearch, color: '#3b82f6' },
                                      ])
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
                        {field.value.map((sd: any, idx: number) => {
                          const name = typeof sd === 'string' ? sd : sd.name
                          const color =
                            typeof sd === 'string'
                              ? LEGACY_HEX_COLORS[sd] || '#3b82f6'
                              : sd.color || '#3b82f6'
                          return (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs font-normal pr-1.5 mb-1 flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${color}20`,
                                color: color,
                                borderColor: color,
                                borderWidth: 1,
                              }}
                            >
                              <div
                                className="relative w-4 h-4 rounded-sm overflow-hidden border border-black/10 dark:border-white/10 shrink-0 shadow-sm"
                                title="Alterar cor"
                              >
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const newValues = [...field.value]
                                    newValues[idx] = { name, color: e.target.value }
                                    field.onChange(newValues)
                                  }}
                                  className="absolute -top-2 -left-2 w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                              </div>
                              {name}
                              <button
                                type="button"
                                className="ml-0.5 text-current opacity-70 hover:opacity-100 focus:outline-none transition-opacity"
                                onClick={() => {
                                  const newValues = [...field.value]
                                  newValues.splice(idx, 1)
                                  field.onChange(newValues)
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="edificacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edificação (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bloco A, Torre 1..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (dias)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
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
                      <Input
                        type="date"
                        {...field}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
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
                        <SelectItem value="Em Aprovação">Em Aprovação</SelectItem>
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
                              {u.name || u.codigo || 'Usuário sem nome'}
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
                              {u.name || u.codigo || 'Usuário sem nome'}
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
