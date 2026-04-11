import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Search,
  Briefcase,
} from 'lucide-react'
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

interface Client {
  id: string
  name: string
  document: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zip: string
  phone: string
  altPhone?: string
  contact: string
  email: string
}

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Construtora Alpha S.A',
    document: '12.345.678/0001-90',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
    phone: '(11) 98765-4321',
    altPhone: '(11) 3214-5678',
    contact: 'Carlos Silva',
    email: 'carlos@alpha.com',
  },
  {
    id: '2',
    name: 'Incorporadora Beta Ltda',
    document: '98.765.432/0001-10',
    street: 'Rua das Flores',
    number: '250',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zip: '01400-000',
    phone: '(11) 91234-5678',
    contact: 'Ana Gomes',
    email: 'ana@beta.com',
  },
]

const EMPTY_CLIENT: Client = {
  id: '',
  name: '',
  document: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  altPhone: '',
  contact: '',
  email: '',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client>(EMPTY_CLIENT)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.document.includes(search) ||
      c.contact.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
    } else {
      setEditingClient(EMPTY_CLIENT)
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!editingClient.name || !editingClient.document) {
      toast({
        title: 'Erro de validação',
        description: 'Nome e CNPJ/CPF são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (editingClient.id) {
      setClients((prev) => prev.map((c) => (c.id === editingClient.id ? editingClient : c)))
      toast({ title: 'Sucesso', description: 'Cliente atualizado com sucesso.' })
    } else {
      setClients((prev) => [...prev, { ...editingClient, id: crypto.randomUUID() }])
      toast({ title: 'Sucesso', description: 'Cliente cadastrado com sucesso.' })
    }
    setIsModalOpen(false)
  }

  const handleDelete = () => {
    if (clientToDelete) {
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete))
      toast({ title: 'Deletado', description: 'Cliente removido com sucesso.' })
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
          <p className="text-muted-foreground">
            Gerencie o cadastro completo de clientes da empresa.
          </p>
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
                      <Briefcase className="h-4 w-4" /> {client.document}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleOpenModal(client)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => confirmDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <User className="h-4 w-4 shrink-0 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        Contato Principal
                      </span>
                      <span className="text-foreground font-medium">
                        {client.contact || 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        E-mail
                      </span>
                      <span className="text-foreground font-medium truncate max-w-[200px]">
                        {client.email || 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        Telefones
                      </span>
                      <span className="text-foreground font-medium">
                        {client.phone || 'Não informado'}
                        {client.altPhone ? ` / ${client.altPhone}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/70 mt-1" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                        Endereço Completo
                      </span>
                      <span className="text-foreground font-medium line-clamp-3">
                        {client.street ? `${client.street}, ${client.number}` : 'Não informado'}
                        {client.neighborhood && ` - ${client.neighborhood}`}
                        <br />
                        {client.city && `${client.city} - ${client.state}`}
                        {client.zip && ` / CEP: ${client.zip}`}
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
            <p className="text-muted-foreground">Adicione um novo cliente ou limpe a busca.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>Preencha os dados cadastrais do cliente abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Razão Social / Nome</Label>
              <Input
                value={editingClient.name}
                onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                placeholder="Ex: Construtora Exemplo"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>CNPJ / CPF</Label>
              <Input
                value={editingClient.document}
                onChange={(e) => setEditingClient({ ...editingClient, document: e.target.value })}
                placeholder="Ex: 00.000.000/0000-00"
              />
            </div>
            <div className="col-span-2 space-y-2 pt-2 border-t border-border/50">
              <Label className="text-sm font-semibold text-muted-foreground">Endereço</Label>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Logradouro (Rua, Av.)</Label>
              <Input
                value={editingClient.street}
                onChange={(e) => setEditingClient({ ...editingClient, street: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Número / Complemento</Label>
              <Input
                value={editingClient.number}
                onChange={(e) => setEditingClient({ ...editingClient, number: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Bairro</Label>
              <Input
                value={editingClient.neighborhood}
                onChange={(e) =>
                  setEditingClient({ ...editingClient, neighborhood: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>CEP</Label>
              <Input
                value={editingClient.zip}
                onChange={(e) => setEditingClient({ ...editingClient, zip: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Cidade</Label>
              <Input
                value={editingClient.city}
                onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Estado (UF)</Label>
              <Input
                value={editingClient.state}
                onChange={(e) => setEditingClient({ ...editingClient, state: e.target.value })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
            <div className="col-span-2 space-y-2 pt-2 border-t border-border/50">
              <Label className="text-sm font-semibold text-muted-foreground">Contato</Label>
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Nome do Contato Principal</Label>
              <Input
                value={editingClient.contact}
                onChange={(e) => setEditingClient({ ...editingClient, contact: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={editingClient.email}
                onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Telefone Principal</Label>
              <Input
                value={editingClient.phone}
                onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <Label>Telefone Alternativo (Opcional)</Label>
              <Input
                value={editingClient.altPhone || ''}
                onChange={(e) => setEditingClient({ ...editingClient, altPhone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita.
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
