import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MOCK_LOGS } from '@/lib/mock-logs'
import { format } from 'date-fns'
import { History, ArrowRight } from 'lucide-react'

export default function Activities() {
  const sortedLogs = [...MOCK_LOGS].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Atividades Recentes</h1>
        <p className="text-muted-foreground">
          Histórico cronológico de alterações realizadas pela equipe.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Log de Ações
          </CardTitle>
          <CardDescription>Acompanhe tudo o que acontece no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {sortedLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start hover:bg-muted/30 transition-colors"
              >
                <img
                  src={log.user.avatar}
                  alt={log.user.name}
                  className="w-10 h-10 rounded-full shrink-0 object-cover border border-border/50 shadow-sm"
                />

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-foreground">{log.user.name}</span>
                      <span className="text-muted-foreground mx-1">realizou a ação de</span>
                      <span className="font-medium px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs uppercase tracking-wider">
                        {log.action}
                      </span>
                      <span className="text-muted-foreground mx-1">em</span>
                      <span className="font-medium text-foreground">
                        {log.entityType}: {log.entityName}
                      </span>
                    </p>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                      {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>

                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-3 text-sm bg-background border border-border/50 rounded-md p-3 space-y-2">
                      {log.changes.map((change, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 text-muted-foreground"
                        >
                          <span className="font-medium min-w-[120px] text-foreground/80">
                            {change.field}:
                          </span>
                          {change.oldValue && (
                            <>
                              <span className="line-through decoration-muted-foreground/50">
                                {change.oldValue}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}
                          <span className="font-medium text-primary">{change.newValue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sortedLogs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma atividade registrada recentemente.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
