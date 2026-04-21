import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building, Mail, Phone, MapPin, Edit2, Trash2, Plus, Search, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  cnpj_cpf: string
  address: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  alt_phone?: string
  contact_name?: string
}

const EMPTY_CLIENT: Partial<Client> = {
  name: '',
  email: '',
  phone: '',
  cnpj_cpf: '',
  address: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  alt_phone: '',
  contact_name: '',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client>>(EMPTY_CLIENT)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const records = await pb.collection('clients').getFullList<Client>({ sort: '-created' })
      setClients(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('clients', () => loadData())

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
        } else {
          toast({
            title: 'CEP não encontrado',
            description: 'Verifique o número do CEP informado.',
            variant: 'destructive',
          })
        }
      } catch (err) {
        console.error('ViaCEP Error:', err)
        toast({
          title: 'Erro ao buscar CEP',
          description: 'Não foi possível consultar o endereço.',
          variant: 'destructive',
        })
      }
    }
  }

  const formatAddress = (c: Client) => {
    if (c.logradouro || c.cidade || c.cep) {
      return [
        c.logradouro,
        c.numero ? `, ${c.numero}` : '',
        c.bairro ? ` - ${c.bairro}` : '',
        c.cidade ? ` - ${c.cidade}` : '',
        c.uf ? `/${c.uf}` : '',
        c.cep ? ` (CEP: ${c.cep})` : '',
      ]
        .filter(Boolean)
        .join('')
    }
    return c.address || 'Não informado'
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj_cpf?.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())),
  )

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client ? { ...client } : { ...EMPTY_CLIENT })
    setIsModalOpen(true)
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
      setIsModalOpen(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Ocorreu um erro ao salvar o cliente.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (clientToDelete) {
      try {
        await pb.collection('clients').delete(clientToDelete)
        toast({ title: 'Deletado', description: 'Cliente removido com sucesso.' })
      } catch (e: any) {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover o cliente.',
          variant: 'destructive',
        })
      }
      setClientToDelete(null)
      setIsAlertOpen(false)
    }
  }

  const confirmDelete = (id: string) => {
    setClientToDelete(id)
    setIsAlertOpen(true)
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de clientes da empresa.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {client.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 font-medium">
                      <Briefcase className="h-4 w-4" /> {client.cnpj_cpf}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenModal(client)}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => confirmDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        E-mail
                      </span>
                      <span className="text-foreground font-medium truncate">
                        {client.email || 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        Telefone
                      </span>
                      <span className="text-foreground font-medium">
                        {[client.phone, client.alt_phone].filter(Boolean).join(' / ') ||
                          'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {client.contact_name && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="h-4 w-4 shrink-0 flex items-center justify-center text-primary/70">
                        <span className="text-xs">👤</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                          Contato
                        </span>
                        <span className="text-foreground font-medium">{client.contact_name}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/70 mt-1" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        Endereço
                      </span>
                      <span className="text-foreground font-medium line-clamp-3">
                        {formatAddress(client)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-muted/20 border border-dashed rounded-lg">
            <Building className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-medium text-foreground">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground">Adicione um novo cliente ou ajuste sua busca.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                    placeholder="Ex: Construtora Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ / CPF *</Label>
                  <Input
                    value={editingClient.cnpj_cpf || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, cnpj_cpf: e.target.value })
                    }
                    placeholder="Ex: 00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    placeholder="contato@empresa.com"
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
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone Principal</Label>
                  <Input
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone Alternativo</Label>
                  <Input
                    value={editingClient.alt_phone || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, alt_phone: e.target.value })
                    }
                    placeholder="(11) 88888-8888"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary border-b pb-2">Endereço</h3>
              <div className="grid grid-cols-10 gap-4">
                <div className="col-span-10 sm:col-span-3 space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={editingClient.cep || ''}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="col-span-10 sm:col-span-7 hidden sm:block"></div>

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
                <div className="col-span-10 sm:col-span-5 space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={editingClient.bairro || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, bairro: e.target.value })}
                  />
                </div>
                <div className="col-span-10 sm:col-span-4 space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={editingClient.cidade || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, cidade: e.target.value })}
                  />
                </div>
                <div className="col-span-10 sm:col-span-1 space-y-2">
                  <Label>UF</Label>
                  <Input
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
                <div className="col-span-10 space-y-2 pt-2">
                  <Label className="text-muted-foreground text-xs">
                    Endereço (Complemento / Legado)
                  </Label>
                  <Input
                    value={editingClient.address || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, address: e.target.value })
                    }
                    placeholder="Complemento ou registro antigo"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita. O cliente será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
