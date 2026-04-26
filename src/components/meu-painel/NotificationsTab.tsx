import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  FileText,
} from 'lucide-react'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { exportNotificationsCSV } from '@/lib/export'
import { toast } from 'sonner'

export function NotificationsTab() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [disciplineFilter, setDisciplineFilter] = useState('all')

  const disciplines = [
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

  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await pb.collection('notifications').getFullList({
        filter: `user = "${user.id}"`,
        sort: '-created',
      })
      setNotifications(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  useRealtime('notifications', loadNotifications, !!user)

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) => pb.collection('notifications').update(n.id, { read: true })),
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportCSV = () => {
    try {
      exportNotificationsCSV(filtered)
      toast.success('Notificações exportadas com sucesso!')
    } catch (e) {
      toast.error('Erro ao exportar notificações.')
      console.error(e)
    }
  }

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await pb.collection('notifications').update(notif.id, { read: true })
      } catch {
        /* intentionally ignored */
      }
    }
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterStatus === 'unread' && n.read) return false
      if (filterStatus === 'read' && !n.read) return false

      if (startDate || endDate) {
        const nDate = parseISO(n.created)
        const s = startDate ? startOfDay(parseISO(startDate)) : new Date(0)
        const e = endDate ? endOfDay(parseISO(endDate)) : new Date(8640000000000000)
        if (!isWithinInterval(nDate, { start: s, end: e })) return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = n.title?.toLowerCase().includes(query)
        const matchesMessage = n.message?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesMessage) return false
      }

      if (disciplineFilter !== 'all') {
        const disciplineLower = disciplineFilter.toLowerCase()
        const matchesTitle = n.title?.toLowerCase().includes(disciplineLower)
        const matchesMessage = n.message?.toLowerCase().includes(disciplineLower)
        if (!matchesTitle && !matchesMessage) return false
      }

      return true
    })
  }, [notifications, filterStatus, startDate, endDate, searchQuery, disciplineFilter])

  const getNotificationVisuals = (notif: any) => {
    const type = notif.action_type || ''
    const title = notif.title?.toLowerCase() || ''

    if (
      type === 'Alerta de atraso' ||
      title.includes('atraso') ||
      title.includes('atrasada') ||
      title.includes('vencida')
    ) {
      return {
        Icon: AlertCircle,
        colorText: 'text-rose-600 dark:text-rose-500',
        bgUnread: 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/30',
        borderColor: 'border-rose-200 dark:border-rose-900/50',
        borderClass: 'border-l-4 border-l-rose-500',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        indicator: 'bg-rose-500',
      }
    }
    if (type === 'Alerta de urgência' || title.includes('hoje') || title.includes('urgência')) {
      return {
        Icon: Calendar,
        colorText: 'text-orange-600 dark:text-orange-500',
        bgUnread:
          'bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/50 dark:hover:bg-orange-950/30',
        borderColor: 'border-orange-200 dark:border-orange-900/50',
        borderClass: 'border-l-4 border-l-orange-500',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
        indicator: 'bg-orange-500',
      }
    }
    if (
      type === 'Alerta preventivo' ||
      title.includes('preventivo') ||
      title.includes('3 dias') ||
      title.includes('vence em')
    ) {
      return {
        Icon: Clock,
        colorText: 'text-yellow-600 dark:text-yellow-500',
        bgUnread:
          'bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100/50 dark:hover:bg-yellow-950/30',
        borderColor: 'border-yellow-200 dark:border-yellow-900/50',
        borderClass: 'border-l-4 border-l-yellow-500',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        indicator: 'bg-yellow-500',
      }
    }

    if (notif.is_important || title.includes('urgente')) {
      return {
        Icon: AlertTriangle,
        colorText: 'text-red-600 dark:text-red-500',
        bgUnread: 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30',
        borderColor: 'border-red-300 dark:border-red-900/60',
        borderClass: 'border-l-4 border-l-red-600',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        indicator: 'bg-red-600 animate-pulse',
      }
    }

    if (title.includes('novo arquivo') || title.includes('documento')) {
      return {
        Icon: FileText,
        colorText: 'text-blue-600 dark:text-blue-500',
        bgUnread: 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-900/50',
        borderClass: 'border-l-4 border-l-blue-500',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        indicator: 'bg-blue-500',
      }
    }

    return {
      Icon: Bell,
      colorText: 'text-primary',
      bgUnread: 'bg-primary/5 hover:bg-primary/10',
      borderColor: 'border-primary/20',
      borderClass: 'border-l-4 border-l-primary/40',
      iconBg: 'bg-primary/20',
      indicator: 'bg-primary',
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div className="space-y-2 w-full md:w-auto">
          <Label>Status</Label>
          <ToggleGroup
            type="single"
            value={filterStatus}
            onValueChange={(v) => v && setFilterStatus(v)}
            className="justify-start"
          >
            <ToggleGroupItem value="all">Todas</ToggleGroupItem>
            <ToggleGroupItem value="unread">Não Lidas</ToggleGroupItem>
            <ToggleGroupItem value="read">Lidas</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
          <div className="space-y-2 flex-1 sm:flex-none min-w-[200px]">
            <Label>Buscar Notificação</Label>
            <Input
              placeholder="Buscar por projeto ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 flex-1 sm:flex-none min-w-[180px]">
            <Label>Disciplina</Label>
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Todas as Disciplinas</option>
              {disciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 flex-1 sm:flex-none">
            <Label>Data Inicial</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2 flex-1 sm:flex-none">
            <Label>Data Final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="w-full md:w-auto pt-4 md:pt-0 flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleMarkAllAsRead} variant="outline" className="w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center p-8 bg-muted/50 rounded-xl border border-dashed">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma notificação encontrada.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const visuals = getNotificationVisuals(n)
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer flex gap-4 items-start ${n.read ? 'bg-background hover:bg-muted/50 border-border opacity-80' : `${visuals.bgUnread} ${visuals.borderColor} shadow-sm`} ${visuals.borderClass} overflow-hidden`}
              >
                <div
                  className={`mt-1 rounded-full p-2.5 shrink-0 ${n.read ? `bg-muted ${visuals.colorText} opacity-50` : `${visuals.iconBg} ${visuals.colorText}`}`}
                >
                  <visuals.Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <h4
                      className={`font-semibold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}
                    >
                      {n.title}
                    </h4>
                    <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(parseISO(n.created), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${n.read ? 'text-muted-foreground' : 'text-foreground/90'}`}
                  >
                    {n.message}
                  </p>
                </div>
                {!n.read && (
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-2.5 shrink-0 shadow-sm ${visuals.indicator}`}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
