import { TimeEntryForm } from '@/components/timesheet/TimeEntryForm'
import { HoursChart } from '@/components/timesheet/HoursChart'
import { ProductivityChart } from '@/components/timesheet/ProductivityChart'
import { CostTable } from '@/components/timesheet/CostTable'

export default function Timesheet() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Timesheet & Produtividade</h2>
        <p className="text-muted-foreground">
          Gerencie o apontamento de horas e acompanhe o desempenho da equipe.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <div className="space-y-6 flex flex-col">
          <TimeEntryForm />
          <ProductivityChart />
        </div>

        <div className="space-y-6 flex flex-col">
          <HoursChart />
          <CostTable />
        </div>
      </div>
    </div>
  )
}
