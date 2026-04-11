import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User } from '@/types/project'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'

export function ProjetistaForm({ onAdd }: { onAdd: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    specialty: '',
    crea: '',
    address: '',
    phone: '',
    email: '',
    bankData: { bank: '', agency: '', account: '', pix: '' },
  })

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('bank_')) {
      const bankField = field.replace('bank_', '')
      setFormData((prev) => ({
        ...prev,
        bankData: { ...prev.bankData!, [bankField]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.specialty) {
      toast({
        title: 'Erro',
        description: 'Nome e Especialidade são obrigatórios',
        variant: 'destructive',
      })
      return
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      avatar: `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${Math.random()}`,
      role: 'Projetista',
      specialty: formData.specialty,
      crea: formData.crea,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      bankData: formData.bankData as User['bankData'],
      assignedProjects: [],
    }

    onAdd(newUser)
    toast({ title: 'Sucesso', description: 'Projetista cadastrado com sucesso.' })
    setOpen(false)
    setFormData({
      name: '',
      specialty: '',
      crea: '',
      address: '',
      phone: '',
      email: '',
      bankData: { bank: '', agency: '', account: '', pix: '' },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Projetista
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Novo Projetista</DialogTitle>
          <DialogDescription>Cadastre um novo projetista na equipe.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="João da Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(v) => handleChange('specialty', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                    <SelectItem value="Engenheiro Mecânico">Engenheiro Mecânico</SelectItem>
                    <SelectItem value="Engenheiro Elétrico">Engenheiro Elétrico</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CREA</Label>
                <Input
                  value={formData.crea}
                  onChange={(e) => handleChange('crea', e.target.value)}
                  placeholder="123456/UF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="joao@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-3">Dados Bancários</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.bankData?.bank}
                    onChange={(e) => handleChange('bank_bank', e.target.value)}
                    placeholder="Ex: Itaú, Nubank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    value={formData.bankData?.agency}
                    onChange={(e) => handleChange('bank_agency', e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta Corrente</Label>
                  <Input
                    value={formData.bankData?.account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.bankData?.pix}
                    onChange={(e) => handleChange('bank_pix', e.target.value)}
                    placeholder="CPF, Email ou Celular"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button onClick={handleSave}>Salvar Projetista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
