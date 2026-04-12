import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown, PlusCircle, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TaskNode = any

interface TaskRowProps {
  task: TaskNode
  depth: number
  columns: any
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
  const hasChildren = task.children && task.children.length > 0

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
            <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
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
                task.status === 'Concluído'
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'font-medium text-slate-700 dark:text-slate-200',
              )}
              onClick={() => onClickTitle?.(task)}
              title="Clique para ver detalhes"
            >
              {task.title || task.titulo || 'Tarefa sem título'}
            </button>
          </div>
        </TableCell>
      )}

      {columns.responsavel && (
        <TableCell className="py-2.5">
          <select
            className="bg-transparent text-sm w-full outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 py-0.5 transition-colors focus:ring-2 focus:ring-primary/50"
            value={task.responsible || ''}
            onChange={(e) => onUpdate(task.id, { responsible: e.target.value })}
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
            className={cn(
              'bg-transparent text-sm w-full outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 py-0.5 transition-colors focus:ring-2 focus:ring-primary/50',
              isOverdue(task.due_date) && task.status !== 'Concluído'
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300',
            )}
            value={task.due_date ? task.due_date.split(' ')[0] : ''}
            onChange={(e) => onUpdate(task.id, { due_date: e.target.value })}
          />
        </TableCell>
      )}

      {columns.status && (
        <TableCell className="py-2.5">
          <select
            className={cn(
              'bg-transparent text-sm w-full outline-none cursor-pointer rounded px-2 py-1 transition-colors focus:ring-2 focus:ring-primary/50 font-medium',
              task.status === 'Concluído'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : task.status === 'Em Andamento'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700',
            )}
            value={task.status || 'Pendente'}
            onChange={(e) => onUpdate(task.id, { status: e.target.value })}
          >
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </TableCell>
      )}

      {columns.acoes && (
        <TableCell className="py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 hover:bg-primary/10 hover:text-primary text-slate-500"
              onClick={() => onAdd(task.id)}
              title="Adicionar subtarefa"
            >
              <PlusCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              onClick={() => onDelete(task.id)}
              title="Excluir tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
