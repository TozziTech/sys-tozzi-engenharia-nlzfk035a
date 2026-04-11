import { useState } from 'react'
import { Calendar as CalendarIcon, Search, Plus, MoreHorizontal } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const initialData = [
  {
    id: 'EQ-001',
    equipamento: 'Rompedor 5 Kg',
    localAtual: 'Obra - Condomínio Alpha',
    envio: '10/03/2026',
    retornoPrevisto: '15/03/2026',
    responsavel: 'João Silva',
    status: 'Em Uso',
    atrasado: true,
  },
  {
    id: 'EQ-002',
    equipamento: 'Betoneira 400L',
    localAtual: 'Obra - Edifício Beta',
    envio: '12/03/2026',
    retornoPrevisto: '20/03/2026',
    responsavel: 'Carlos Santos',
    status: 'Em Uso',
    atrasado: false,
  },
  {
    id: 'EQ-003',
    equipamento: 'Furadeira de Bancada',
    localAtual: 'Base Principal',
    envio: '-',
    retornoPrevisto: '-',
    responsavel: '-',
    status: 'Disponível',
    atrasado: false,
  },
]

export default function GestaoCentral() {
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  const [items, setItems] = useState(initialData)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    equipamento: '',
    localAtual: '',
    envio: '',
    retornoPrevisto: '',
    responsavel: '',
    status: 'Disponível',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleSave = () => {
    const isAtrasado = formData.status === 'Atrasado'
    const finalStatus = isAtrasado ? 'Em Uso' : formData.status

    const newItem = {
      id: `EQ-${String(items.length + 1).padStart(3, '0')}`,
      equipamento: formData.equipamento || '-',
      localAtual: formData.localAtual || '-',
      envio: formData.envio ? format(parseISO(formData.envio), 'dd/MM/yyyy') : '-',
      retornoPrevisto: formData.retornoPrevisto
        ? format(parseISO(formData.retornoPrevisto), 'dd/MM/yyyy')
        : '-',
      responsavel: formData.responsavel || '-',
      status: finalStatus,
      atrasado: isAtrasado,
    }

    setItems([...items, newItem])
    setIsDialogOpen(false)
    setFormData({
      equipamento: '',
      localAtual: '',
      envio: '',
      retornoPrevisto: '',
      responsavel: '',
      status: 'Disponível',
    })

    toast({
      title: 'Equipamento registrado',
      description: 'O novo equipamento foi adicionado com sucesso.',
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Equipamentos</h2>
      </div>

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 pb-4 border-b">
        <div className="flex items-center space-x-2">
          <Button variant="default">Gestão Central</Button>
          <Button variant="ghost">Visão de Campo</Button>
          <Button variant="ghost">Relatório</Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Novo Equipamento</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para registrar um novo equipamento no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="equipamento">Equipamento</Label>
                <Input
                  id="equipamento"
                  name="equipamento"
                  placeholder="Ex: Betoneira"
                  value={formData.equipamento}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localAtual">Local Atual</Label>
                <Input
                  id="localAtual"
                  name="localAtual"
                  placeholder="Ex: Obra Alpha"
                  value={formData.localAtual}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="envio">Data de Envio</Label>
                <Input
                  id="envio"
                  type="date"
                  name="envio"
                  value={formData.envio}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retornoPrevisto">Retorno Previsto</Label>
                <Input
                  id="retornoPrevisto"
                  type="date"
                  name="retornoPrevisto"
                  value={formData.retornoPrevisto}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  name="responsavel"
                  placeholder="Ex: João Silva"
                  value={formData.responsavel}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleSelectChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 py-4">
        <div className="w-full lg:w-[300px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar equipamento..." className="pl-8" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[220px] justify-start text-left font-normal',
                  !dateFrom && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? (
                  format(dateFrom, 'PPP', { locale: ptBR })
                ) : (
                  <span>Enviado a partir de</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground hidden sm:inline-block">-</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[220px] justify-start text-left font-normal',
                  !dateTo && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP', { locale: ptBR }) : <span>Enviado até</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Local Atual</TableHead>
              <TableHead>Envio</TableHead>
              <TableHead>Retorno Previsto</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="whitespace-nowrap">{item.equipamento}</span>
                    {item.atrasado && (
                      <Badge variant="destructive" className="whitespace-nowrap">
                        Atrasado
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.localAtual}</TableCell>
                <TableCell>{item.envio}</TableCell>
                <TableCell className={cn(item.atrasado && 'text-destructive font-medium')}>
                  {item.retornoPrevisto}
                </TableCell>
                <TableCell>{item.responsavel}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === 'Em Uso' ? 'default' : 'secondary'}
                    className={cn(item.status === 'Em Uso' && 'bg-blue-500 hover:bg-blue-600')}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
