import React from 'react'
import { QuoteGeneratorModal } from '@/components/QuoteGeneratorModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Briefcase, CheckCircle2, Clock, FileText, Users } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Projetos</h2>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao painel de gerenciamento. Acompanhe o status e gere novas propostas.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <QuoteGeneratorModal>
            <Button className="w-full md:w-auto shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              Gerar Orçamento
            </Button>
          </QuoteGeneratorModal>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 iniciados neste mês</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">34</div>
            <p className="text-xs text-muted-foreground mt-1">-5 desde a última semana</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">128</div>
            <p className="text-xs text-muted-foreground mt-1">+14 neste ano</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe Ativa</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">2 online no momento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Projetos em Destaque</CardTitle>
            <CardDescription>
              Acompanhamento do progresso dos projetos mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  name: 'Redesign do E-commerce',
                  client: 'TechStore',
                  progress: 75,
                  status: 'Em andamento',
                },
                { name: 'App de Entregas', client: 'FastLog', progress: 30, status: 'Atrasado' },
                {
                  name: 'Sistema de Gestão ERP',
                  client: 'AgroFarm',
                  progress: 90,
                  status: 'Em revisão',
                },
                {
                  name: 'Landing Page B2B',
                  client: 'SaaS Inc.',
                  progress: 15,
                  status: 'Iniciando',
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-muted/40 pb-4 last:border-0 last:pb-0 gap-4 sm:gap-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-none">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.client}</p>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${p.progress < 50 ? (p.progress < 35 ? 'bg-destructive' : 'bg-orange-500') : 'bg-primary'}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium w-9 text-right">{p.progress}%</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atualizações da equipe de projetos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  user: 'João Silva',
                  action: 'finalizou a tarefa no',
                  target: 'Design System',
                  time: 'Há 2 horas',
                },
                {
                  user: 'Maria Santos',
                  action: 'adicionou um comentário em',
                  target: 'App de Entregas',
                  time: 'Há 4 horas',
                },
                {
                  user: 'Pedro Costa',
                  action: 'criou o projeto',
                  target: 'Landing Page B2B',
                  time: 'Ontem às 16:30',
                },
                {
                  user: 'Ana Oliveira',
                  action: 'aprovou a entrega do',
                  target: 'Redesign do E-commerce',
                  time: 'Ontem às 10:15',
                },
                {
                  user: 'Lucas Mendes',
                  action: 'alterou o status de',
                  target: 'Sistema de Gestão ERP',
                  time: 'Há 2 dias',
                },
              ].map((a, i) => (
                <div key={i} className="flex items-start">
                  <div className="bg-muted/50 p-2 rounded-full mr-4 mt-0.5 border border-muted">
                    <Activity className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{a.user}</span> {a.action}{' '}
                      <span className="font-semibold text-primary">{a.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
