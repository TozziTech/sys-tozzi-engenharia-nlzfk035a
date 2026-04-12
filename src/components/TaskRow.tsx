import { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { GripVertical, ChevronRight, ChevronDown, Plus, Trash2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

export interface TaskNode {
  id: string
  title: string
  status: string
  parent_task?: string | null
  responsible?: string | null
  due_date?: string | null
  created: string
  children: TaskNode[]
}

export const TaskRow = memo(
  ({
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
  }: any) => {
    const isDropTarget = dropTarget?.id === task.id
    const dropPos = dropTarget?.position

    return (
      <TableRow
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragOver={(e) => onDragOver(e, task.id)}
        onDrop={(e) => onDrop(e, task.id)}
        onDragEnd={onDragEnd}
        className={cn(
          'group hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-grab active:cursor-grabbing',
          draggedId === task.id && 'opacity-50',
          isDropTarget && dropPos === 'inside' && 'bg-primary/10 dark:bg-primary/20',
        )}
      >
        {columns.tarefa && (
          <TableCell
            className={cn(
              'border-r border-b p-2',
              isDropTarget && dropPos === 'before' && 'border-t-2 border-t-primary',
              isDropTarget && dropPos === 'after' && 'border-b-2 border-b-primary',
            )}
          >
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
              <Checkbox
                checked={task.status === 'Concluído'}
                onCheckedChange={(c) => onUpdate(task.id, { status: c ? 'Concluído' : 'Pendente' })}
              />
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {task.children.length > 0 && (
                  <button
                    onClick={() => onToggleExpand(task.id)}
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
              <span className="text-sm flex-1 truncate font-medium">{task.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={() => onAdd(task.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </TableCell>
        )}

        {columns.responsavel && (
          <TableCell className="border-r border-b p-1">
            <Select
              value={task.responsible || 'unassigned'}
              onValueChange={(val) =>
                onUpdate(task.id, { responsible: val === 'unassigned' ? '' : val })
              }
            >
              <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent w-full px-2 shadow-none">
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="unassigned" className="text-muted-foreground italic text-xs">
                  Sem responsável
                </SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          u.avatar
                            ? pb.files.getUrl(u, u.avatar)
                            : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                        }
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                        alt=""
                      />
                      <span className="truncate">{u.name || u.email || 'Usuário'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
        )}

        {columns.dataEntrega && (
          <TableCell className="border-r border-b p-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-8 text-xs w-full justify-start text-left font-normal border-transparent hover:border-input px-2 shadow-none',
                    !task.due_date && 'text-muted-foreground',
                    task.status !== 'Concluído' &&
                      isOverdue(task.due_date) &&
                      'text-red-500 font-medium',
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                  {task.due_date ? (
                    format(new Date(task.due_date), 'dd/MM/yyyy')
                  ) : (
                    <span>Definir data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.due_date ? new Date(task.due_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const d = new Date(date)
                      d.setHours(12, 0, 0, 0)
                      onUpdate(task.id, { due_date: d.toISOString() })
                    } else {
                      onUpdate(task.id, { due_date: '' })
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </TableCell>
        )}

        {columns.status && (
          <TableCell className="border-r border-b p-1">
            <Select
              value={task.status || 'Pendente'}
              onValueChange={(val) => onUpdate(task.id, { status: val })}
            >
              <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent w-full px-2 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente" className="text-xs">
                  Pendente
                </SelectItem>
                <SelectItem value="Em Andamento" className="text-xs">
                  Em Andamento
                </SelectItem>
                <SelectItem value="Concluído" className="text-xs">
                  Concluído
                </SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
        )}

        {columns.acoes && (
          <TableCell className="border-b p-1 text-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TableCell>
        )}
      </TableRow>
    )
  },
)
