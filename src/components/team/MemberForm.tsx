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

export function MemberForm({ onAdd }: { onAdd: (user: User) => void }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    specialty: '',
    role: 'Projetista',
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
    if (!formData.name) {
      toast({
        title: 'Atenção',
        description: 'O nome do membro é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      avatar: '',
      role: formData.role as any,
      specialty: formData.specialty,
      crea: formData.crea,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      bankData: formData.bankData as User['bankData'],
      assignedProjects: [],
    }

    onAdd(newUser)
    toast({ title: 'Sucesso', description: 'Membro adicionado à equipe com sucesso.' })
    setOpen(false)
    setFormData({
      name: '',
      specialty: '',
      role: 'Projetista',
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
          <Plus className="mr-2 h-4 w-4" /> Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Novo Membro</DialogTitle>
            <DialogDescription>
              Cadastre um novo profissional na equipe do sistema.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="grid gap-6 py-4 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Cargo</Label>
                <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                    <SelectItem value="Projetista">Projetista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Especialidade</Label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  placeholder="Ex: Engenheiro Civil"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
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
                placeholder="contato@exemplo.com"
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

            <div className="mt-2 pt-6 border-t border-border/50">
              <h4 className="font-semibold text-sm mb-4">Dados Bancários</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Banco</Label>
                  <Input
                    value={formData.bankData?.bank}
                    onChange={(e) => handleChange('bank_bank', e.target.value)}
                    placeholder="Ex: Itaú, Nubank"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Agência</Label>
                  <Input
                    value={formData.bankData?.agency}
                    onChange={(e) => handleChange('bank_agency', e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Conta Corrente</Label>
                  <Input
                    value={formData.bankData?.account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
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

        <div className="p-6 pt-4 border-t border-border/50 bg-muted/10">
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Membro</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
