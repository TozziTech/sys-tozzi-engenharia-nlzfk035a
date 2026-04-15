import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  type DistributionCalculation,
  updateDistributionCalculation,
} from '@/services/distribution_calculations'
import { useToast } from '@/hooks/use-toast'

interface Props {
  record: DistributionCalculation | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function EditDistributionDialog({ record, isOpen, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState<number | ''>('')
  const [nfPct, setNfPct] = useState<number | ''>(0)
  const [expenses, setExpenses] = useState<number | ''>(0)
  const [artAmount, setArtAmount] = useState<number | ''>(0)
  const [workingCapitalPct, setWorkingCapitalPct] = useState<number | ''>(10)
  const [samuelPct, setSamuelPct] = useState<number | ''>(50)
  const [tozziPct, setTozziPct] = useState<number | ''>(50)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (record) {
      setDescription(record.description)
      setTotalAmount(record.total_amount)
      setNfPct(record.nf_pct || 0)
      setExpenses(record.expenses || 0)
      setArtAmount(record.art_amount || 0)
      setWorkingCapitalPct(record.working_capital_pct || 0)
      setSamuelPct(record.samuel_pct || 50)
      setTozziPct(record.tozzi_pct || 50)
    }
  }, [record])

  const safeTotal = Number(totalAmount) || 0
  const safeNfPct = Number(nfPct) || 0
  const safeExpenses = Number(expenses) || 0
  const safeArtAmount = Number(artAmount) || 0
  const safeCapitalPct = Number(workingCapitalPct) || 0
  const safeSamuelPct = Number(samuelPct) || 0
  const safeTozziPct = Number(tozziPct) || 0

  const nfAmount = safeTotal * (safeNfPct / 100)
  const workingCapitalValue = safeTotal * (safeCapitalPct / 100)
  const calculatedNet = safeTotal - safeExpenses - safeArtAmount - nfAmount - workingCapitalValue
  const netValue = Math.max(0, calculatedNet)
  const samuelAmount = netValue * (safeSamuelPct / 100)
  const tozziAmount = netValue * (safeTozziPct / 100)

  const handleSave = async () => {
    if (!record || !description || safeTotal <= 0) {
      toast({
        title: 'Erro',
        description: 'Preencha a descrição e valor bruto.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await updateDistributionCalculation(record.id, {
        description,
        total_amount: safeTotal,
        nf_pct: safeNfPct,
        nf_amount: nfAmount,
        expenses: safeExpenses,
        art_amount: safeArtAmount,
        working_capital_pct: safeCapitalPct,
        samuel_pct: safeSamuelPct,
        tozzi_pct: safeTozziPct,
        net_value: netValue,
        samuel_amount: samuelAmount,
        tozzi_amount: tozziAmount,
      })
      toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' })
      onSaved()
      onClose()
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar registro.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Registro de Distribuição</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Bruto (R$)</Label>
              <Input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>NF (%)</Label>
              <Input
                type="number"
                value={nfPct}
                onChange={(e) => setNfPct(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Despesas (R$)</Label>
              <Input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>ART (R$)</Label>
              <Input
                type="number"
                value={artAmount}
                onChange={(e) => setArtAmount(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Capital de Giro (%)</Label>
              <Input
                type="number"
                value={workingCapitalPct}
                onChange={(e) => setWorkingCapitalPct(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Líquido</Label>
              <Input disabled value={formatCurrency(netValue)} className="font-semibold bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Samuel (%)</Label>
              <Input
                type="number"
                value={samuelPct}
                onChange={(e) => setSamuelPct(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Tozzi (%)</Label>
              <Input
                type="number"
                value={tozziPct}
                onChange={(e) => setTozziPct(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
