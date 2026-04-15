import { useMemo, useState, useEffect } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Check } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

const PRESETS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b']

function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const safeColor = color.startsWith('#') && color.length === 7 ? color : '#000000'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            className="w-6 h-6 rounded-full flex items-center justify-center border"
            style={{ backgroundColor: p }}
            onClick={() => onChange(p)}
          >
            {color.toLowerCase() === p.toLowerCase() && (
              <Check className="h-3 w-3 text-white mix-blend-difference" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 text-xs font-mono"
        />
      </div>
    </div>
  )
}

function ColorMenu({ colors, onChange }: { colors: any; onChange: any }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Cor Samuel</Label>
            <ColorPicker color={colors.samuel} onChange={(c) => onChange('samuel', c)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cor Tozzi</Label>
            <ColorPicker color={colors.tozzi} onChange={(c) => onChange('tozzi', c)} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface Props {
  data: any[]
}

export function DistributionChart({ data }: Props) {
  const [settingsId, setSettingsId] = useState('')
  const [chartColors, setChartColors] = useState<any>({})

  useEffect(() => {
    pb.collection('company_settings')
      .getFullList()
      .then((res) => {
        if (res.length > 0) {
          setSettingsId(res[0].id)
          setChartColors(res[0].chart_colors || {})
        }
      })
      .catch(() => {})
  }, [])

  useRealtime('company_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setChartColors(e.record.chart_colors || {})
      setSettingsId(e.record.id)
    }
  })

  const handleColor = async (chart: string, series: string, color: string) => {
    const newColors = {
      ...chartColors,
      [chart]: { ...(chartColors[chart] || {}), [series]: color },
    }
    setChartColors(newColors)
    if (settingsId) {
      try {
        await pb.collection('company_settings').update(settingsId, { chart_colors: newColors })
      } catch (e) {
        console.error(e)
      }
    }
  }

  const annualData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const year = new Date(curr.date || curr.created).getFullYear().toString()
      if (!acc[year]) acc[year] = { year, samuel: 0, tozzi: 0, net: 0 }
      acc[year].samuel += curr.samuel_amount || 0
      acc[year].tozzi += curr.tozzi_amount || 0
      acc[year].net += curr.net_value || 0
      return acc
    }, {})
    return Object.values(grouped).sort((a: any, b: any) => a.year.localeCompare(b.year))
  }, [data])

  const monthlyData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const date = new Date(curr.date || curr.created)
      const key = format(date, 'yyyy-MM')
      if (!acc[key])
        acc[key] = {
          key,
          label: format(date, 'MMM/yy', { locale: ptBR }),
          samuel: 0,
          tozzi: 0,
          net: 0,
          ts: date.getTime(),
        }
      acc[key].samuel += curr.samuel_amount || 0
      acc[key].tozzi += curr.tozzi_amount || 0
      acc[key].net += curr.net_value || 0
      return acc
    }, {})
    return Object.values(grouped)
      .sort((a: any, b: any) => a.ts - b.ts)
      .slice(-12)
  }, [data])

  const ac = {
    samuel: chartColors.annual?.samuel || 'hsl(var(--chart-1))',
    tozzi: chartColors.annual?.tozzi || 'hsl(var(--chart-2))',
  }
  const mc = {
    samuel: chartColors.monthly?.samuel || 'hsl(var(--chart-1))',
    tozzi: chartColors.monthly?.tozzi || 'hsl(var(--chart-2))',
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card
        className="flex-1 flex flex-col border-border/50 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Distribuição Anual</CardTitle>
            <CardDescription>Visão geral de distribuição por ano</CardDescription>
          </div>
          <ColorMenu colors={ac} onChange={(s: string, c: string) => handleColor('annual', s, c)} />
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          <ChartContainer
            config={{
              samuel: { label: 'Samuel', color: ac.samuel },
              tozzi: { label: 'Tozzi', color: ac.tozzi },
            }}
            className="h-full w-full"
          >
            <BarChart data={annualData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="samuel" name="Samuel" fill={ac.samuel} radius={[4, 4, 0, 0]} />
              <Bar dataKey="tozzi" name="Tozzi" fill={ac.tozzi} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card
        className="flex-1 flex flex-col border-border/50 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Distribuição Mensal</CardTitle>
            <CardDescription>Evolução mês a mês (últimos 12 meses)</CardDescription>
          </div>
          <ColorMenu
            colors={mc}
            onChange={(s: string, c: string) => handleColor('monthly', s, c)}
          />
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          <ChartContainer
            config={{
              samuel: { label: 'Samuel', color: mc.samuel },
              tozzi: { label: 'Tozzi', color: mc.tozzi },
            }}
            className="h-full w-full"
          >
            <BarChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="samuel" name="Samuel" fill={mc.samuel} radius={[4, 4, 0, 0]} />
              <Bar dataKey="tozzi" name="Tozzi" fill={mc.tozzi} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
