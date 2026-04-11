import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Wallet, TrendingUp, Briefcase } from 'lucide-react'

const mockFinancialData = [
  { month: 'Jan', amount: 4500 },
  { month: 'Fev', amount: 5200 },
  { month: 'Mar', amount: 4800 },
  { month: 'Abr', amount: 6100 },
  { month: 'Mai', amount: 5900 },
  { month: 'Jun', amount: 7200 },
]

export function ProjetistaDashboard({ user }: { user: User }) {
  const totalRecebido = mockFinancialData.reduce((acc, curr) => acc + curr.amount, 0)
  const mediaMensal = Math.round(totalRecebido / mockFinancialData.length)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full mt-2" variant="default">
          Ver Recebimentos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Dashboard Financeiro</DialogTitle>
          <DialogDescription>Resumo de recebimentos do projetista {user.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Recebido
                </CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-bold">
                R$ {totalRecebido.toLocaleString('pt-BR')}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Média Mensal
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-bold">
                R$ {mediaMensal.toLocaleString('pt-BR')}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projetos Ativos
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-2xl font-bold">
                {user.assignedProjects?.length || 0}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de Recebimentos (Últimos 6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ amount: { label: 'Recebimentos', color: 'hsl(var(--primary))' } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={mockFinancialData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v}`}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="amount"
                    fill="var(--color-amount)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
