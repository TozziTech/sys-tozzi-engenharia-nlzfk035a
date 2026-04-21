import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Client } from '@/services/clients'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Partial<Client>
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSuccess }: Props) {
  const [editingClient, setEditingClient] = useState<Partial<Client>>(client)
  const { toast } = useToast()

  useEffect(() => {
    setEditingClient(client)
  }, [client, open])

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 8) val = val.slice(0, 8)
    const formattedCep = val.length >= 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val
    setEditingClient({ ...editingClient, cep: formattedCep })

    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setEditingClient((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf,
          }))
        }
      } catch (err) {
        console.error('ViaCEP Error:', err)
      }
    }
  }

  const handleSave = async () => {
    if (!editingClient.name || !editingClient.cnpj_cpf) {
      toast({
        title: 'Erro de validação',
        description: 'Nome e CNPJ/CPF são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    try {
      if (editingClient.id) {
        await pb.collection('clients').update(editingClient.id, editingClient)
        toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso.' })
      } else {
        await pb.collection('clients').create(editingClient)
        toast({ title: 'Sucesso', description: 'Cliente cadastrado com sucesso.' })
      }
      onSuccess()
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Ocorreu um erro ao salvar o cliente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>Preencha as informações do cliente abaixo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary border-b pb-2">Dados Principais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ / CPF *</Label>
                <Input
                  value={editingClient.cnpj_cpf || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, cnpj_cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editingClient.email || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary border-b pb-2">
              Redes Sociais e Website
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Website</Label>
                <Input
                  value={editingClient.website || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, website: e.target.value })}
                  placeholder="www.empresa.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={editingClient.instagram || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, instagram: e.target.value })
                  }
                  placeholder="@empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={editingClient.facebook || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, facebook: e.target.value })}
                  placeholder="facebook.com/empresa"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary border-b pb-2">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome do Contato</Label>
                <Input
                  value={editingClient.contact_name || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, contact_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone Principal</Label>
                <Input
                  value={editingClient.phone || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone Alternativo</Label>
                <Input
                  value={editingClient.alt_phone || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, alt_phone: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary border-b pb-2">Endereço</h3>
            <div className="grid grid-cols-10 gap-4">
              <div className="col-span-10 sm:col-span-3 space-y-2">
                <Label>CEP</Label>
                <Input value={editingClient.cep || ''} onChange={handleCepChange} maxLength={9} />
              </div>
              <div className="col-span-10 sm:col-span-7 space-y-2">
                <Label>Logradouro</Label>
                <Input
                  value={editingClient.logradouro || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, logradouro: e.target.value })
                  }
                />
              </div>
              <div className="col-span-10 sm:col-span-3 space-y-2">
                <Label>Número</Label>
                <Input
                  value={editingClient.numero || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, numero: e.target.value })}
                />
              </div>
              <div className="col-span-10 sm:col-span-4 space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={editingClient.bairro || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, bairro: e.target.value })}
                />
              </div>
              <div className="col-span-10 sm:col-span-3 space-y-2">
                <Label>Cidade/UF</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingClient.cidade || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, cidade: e.target.value })}
                  />
                  <Input
                    className="w-16"
                    value={editingClient.uf || ''}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        uf: e.target.value.toUpperCase().slice(0, 2),
                      })
                    }
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
