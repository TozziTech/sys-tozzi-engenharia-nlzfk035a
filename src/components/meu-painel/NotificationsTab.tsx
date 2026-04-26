import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationsTab() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
      return true
    })
  }, [notifications, filterStatus, startDate, endDate])

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
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="space-y-2 flex-1 sm:flex-none">
            <Label>Data Inicial</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2 flex-1 sm:flex-none">
            <Label>Data Final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="w-full md:w-auto pt-4 md:pt-0">
          <Button onClick={handleMarkAllAsRead} variant="outline" className="w-full md:w-auto">
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
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer flex gap-4 items-start ${n.read ? 'bg-background hover:bg-muted/50 border-border' : 'bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-sm'}`}
            >
              <div
                className={`mt-1 rounded-full p-2.5 ${n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'}`}
              >
                {n.is_important ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
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
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2.5 shrink-0 shadow-sm" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
