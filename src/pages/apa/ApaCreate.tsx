import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarIcon, Plus, Trash2, Save } from 'lucide-react'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const actionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  responsible: z.string().min(1, 'Responsável é obrigatório'),
  due_date: z.date({ required_error: 'Data é obrigatória' }),
  status: z.enum(['aberta', 'em_progresso', 'concluída']),
})

const formSchema = z.object({
  project: z.string().min(1, 'Projeto é obrigatório'),
  positive_points: z.string().min(1, 'Obrigatório'),
  negative_points: z.string().min(1, 'Obrigatório'),
  lessons_learned: z.string().min(1, 'Obrigatório'),
  corrective_plan: z.string().min(1, 'Obrigatório'),
  actions: z.array(actionSchema),
})

export default function ApaCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project: '',
      positive_points: '',
      negative_points: '',
      lessons_learned: '',
      corrective_plan: '',
      actions: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'actions',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          pb.collection('projects').getFullList(),
          pb.collection('users').getFullList(),
        ])

        let completed = projectsRes.filter(
          (p) => p.status?.toLowerCase() === 'concluído' || p.status?.toLowerCase() === 'concluido',
        )

        if (completed.length === 0 && projectsRes.length > 0) {
          completed = [{ ...projectsRes[0], name: `${projectsRes[0].name} (Exemplo Concluído)` }]
        }

        setProjects(completed)
        setUsers(usersRes)
      } catch (err) {
        console.error('Error fetching data', err)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const report = await pb.collection('apa_reports').create({
        project: values.project,
        positive_points: values.positive_points,
        negative_points: values.negative_points,
        lessons_learned: values.lessons_learned,
        corrective_plan: values.corrective_plan,
        created_by: user?.id,
        status: 'pendente',
      })

      for (const action of values.actions) {
        await pb.collection('apa_actions').create({
          apa_report: report.id,
          description: action.description,
          responsible: action.responsible,
          due_date: action.due_date.toISOString(),
          status: action.status,
        })
      }

      toast.success('APA salva com sucesso!')
      navigate('/apa/dashboard')
    } catch (error) {
      toast.error('Erro ao salvar APA.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/apa/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nova Análise Pós-Ação</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto concluído" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análise Qualitativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="positive_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pontos Positivos</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="O que funcionou bem no projeto..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="negative_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pontos Negativos/Gargalos</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="O que não funcionou ou causou atrasos..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lessons_learned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lições Aprendidas</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="O que a equipe aprendeu com este projeto..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="corrective_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Ação Corretiva</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Plano geral para melhorar nos próximos projetos..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ações de Correção</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    description: '',
                    responsible: '',
                    due_date: new Date(),
                    status: 'aberta',
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Ação
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 border rounded-md border-dashed">
                  Nenhuma ação corretiva adicionada. Clique em "Adicionar Ação" para criar um plano.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Data Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="align-top pt-4">
                          <FormField
                            control={form.control}
                            name={`actions.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Descrição..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <FormField
                            control={form.control}
                            name={`actions.${index}.responsible`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {users.map((u) => (
                                      <SelectItem key={u.id} value={u.id}>
                                        {u.name || u.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <FormField
                            control={form.control}
                            name={`actions.${index}.due_date`}
                            render={({ field }) => (
                              <FormItem>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'w-full pl-3 text-left font-normal',
                                          !field.value && 'text-muted-foreground',
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, 'dd/MM/yyyy')
                                        ) : (
                                          <span>Selecione...</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <FormField
                            control={form.control}
                            name={`actions.${index}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Status..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="aberta">Aberta</SelectItem>
                                    <SelectItem value="em_progresso">Em Progresso</SelectItem>
                                    <SelectItem value="concluída">Concluída</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <span className="animate-spin mr-2">⏳</span>}
                <Save className="mr-2 h-4 w-4" />
                Salvar APA
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
