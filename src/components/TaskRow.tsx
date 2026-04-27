import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Trash2,
  GripVertical,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

export type TaskNode = any

interface TaskRowProps {
  task: TaskNode
  depth: number
  columns: any
  customColumns?: any[]
  users: any[]
  isExpanded: boolean
  draggedId: string | null
  dropTarget: { id: string; position: 'before' | 'after' | 'inside' } | null
  onAdd: (id?: string) => void
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
  onToggleExpand: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  isOverdue: (date: string | null) => boolean
  onClickTitle?: (task: TaskNode) => void
}

export function TaskRow({
  task,
  depth,
  columns,
  customColumns = [],
  users,
  isExpanded,
  draggedId,
  dropTarget,
  onAdd,
  onUpdate,
  onDelete,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isOverdue,
  onClickTitle,
}: TaskRowProps) {
  const { can } = usePermissions()
  const canEditTasks = can('edit', 'tasks')
  const canDeleteTasks = can('delete', 'tasks')
  const canCreateTasks = can('create', 'tasks')

  const hasChildren = task.children && task.children.length > 0

  const due = task.dados_customizados?.due_date ? new Date(task.dados_customizados.due_date) : null
  const now = new Date()
  const isCompleted = task.concluida || task.dados_customizados?.status === 'Concluído'
  let urgencyLevel = 'none'
  if (due && !isCompleted) {
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (diffHours < 0) urgencyLevel = 'overdue'
    else if (diffHours <= 24) urgencyLevel = 'urgent'
  }

  return (
    <TableRow
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDrop={(e) => onDrop(e, task.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50',
        draggedId === task.id && 'opacity-50',
        dropTarget?.id === task.id && dropTarget.position === 'inside' && 'bg-accent/50',
        dropTarget?.id === task.id &&
          dropTarget.position === 'before' &&
          'border-t-2 border-t-primary',
        dropTarget?.id === task.id &&
          dropTarget.position === 'after' &&
          'border-b-2 border-b-primary',
      )}
    >
      {columns.tarefa && (
        <TableCell className="py-2.5">
          <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 1.5}rem` }}>
            <div className="grip-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-800"
              onClick={() => onToggleExpand(task.id)}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )
              ) : (
                <span className="w-4 h-4 inline-block" />
              )}
            </Button>

            <button
              className={cn(
                'cursor-pointer text-left border-none bg-transparent hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm px-1 py-0.5',
                task.concluida
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'font-medium text-slate-700 dark:text-slate-200',
              )}
              onClick={() => onClickTitle?.(task)}
              title="Clique para ver detalhes"
            >
              {task.titulo || task.title || 'Tarefa sem título'}
            </button>
            {!isCompleted && urgencyLevel === 'overdue' && (
              <AlertCircle
                className="w-3.5 h-3.5 text-red-500 inline-block flex-shrink-0 ml-1"
                title="Atrasado"
              />
            )}
            {!isCompleted && urgencyLevel === 'urgent' && (
              <Clock
                className="w-3.5 h-3.5 text-orange-500 inline-block flex-shrink-0 ml-1"
                title="Urgente (< 24h)"
              />
            )}
          </div>
        </TableCell>
      )}

      {columns.responsavel && (
        <TableCell className="py-2.5">
          <select
            disabled={!canEditTasks}
            className="bg-transparent text-sm w-full outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 py-0.5 transition-colors focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            value={task.dados_customizados?.responsible || ''}
            onChange={(e) =>
              onUpdate(task.id, { dados_customizados: { responsible: e.target.value } })
            }
          >
            <option value="">Não atribuído</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </TableCell>
      )}

      {columns.dataEntrega && (
        <TableCell className="py-2.5">
          <input
            type="date"
            disabled={!canEditTasks}
            className={cn(
              'bg-transparent text-sm w-full outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 py-0.5 transition-colors focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
              isOverdue(task.dados_customizados?.due_date) && !task.concluida
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300',
            )}
            value={
              task.dados_customizados?.due_date
                ? task.dados_customizados.due_date.split(' ')[0]
                : ''
            }
            onChange={(e) =>
              onUpdate(task.id, { dados_customizados: { due_date: e.target.value } })
            }
          />
        </TableCell>
      )}

      {columns.status && (
        <TableCell className="py-2.5">
          <select
            disabled={!canEditTasks}
            className={cn(
              'bg-transparent text-sm w-full outline-none cursor-pointer rounded px-2 py-1 transition-colors focus:ring-2 focus:ring-primary/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed',
              task.concluida || task.dados_customizados?.status === 'Concluído'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : task.dados_customizados?.status === 'Atrasado'
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                  : task.dados_customizados?.status === 'Revisão'
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                    : task.dados_customizados?.status === 'Não Realizado'
                      ? 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 hover:bg-gray-100 dark:hover:bg-gray-900/50'
                      : task.dados_customizados?.status === 'Espera'
                        ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                        : task.dados_customizados?.status === 'Em Andamento'
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                          : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700',
            )}
            value={task.concluida ? 'Concluído' : task.dados_customizados?.status || 'Pendente'}
            onChange={(e) => {
              const val = e.target.value
              onUpdate(task.id, {
                concluida: val === 'Concluído',
                dados_customizados: { status: val },
              })
            }}
          >
            <option value="Atrasado">Atrasado</option>
            <option value="Revisão">Revisão</option>
            <option value="Não Realizado">Não Realizado</option>
            <option value="Espera">Espera</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </TableCell>
      )}

      {customColumns.map((col) => (
        <TableCell key={col.id} className="py-2.5">
          <input
            type="text"
            className="bg-transparent text-sm w-full outline-none hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 py-1 transition-colors focus:ring-2 focus:ring-primary/50"
            value={task.dados_customizados?.[col.id] || ''}
            onChange={(e) =>
              onUpdate(task.id, { dados_customizados: { [col.id]: e.target.value } })
            }
            placeholder="-"
          />
        </TableCell>
      ))}

      {columns.acoes && (
        <TableCell className="py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 transition-opacity">
            {canCreateTasks && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 hover:bg-primary/10 hover:text-primary text-slate-500"
                onClick={() => onAdd(task.id)}
                title="Adicionar subtarefa"
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            )}
            {canDeleteTasks && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                onClick={() => onDelete(task.id)}
                title="Excluir tarefa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}

      {/* Empty cell to align with the + button in header */}
      <TableCell className="py-2.5 p-0"></TableCell>
    </TableRow>
  )
}
