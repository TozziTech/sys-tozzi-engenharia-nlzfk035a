import { useState, useEffect } from 'react'
import { Edit2, Trash2, Plus, Search, Eye, Building, Briefcase, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Client } from '@/services/clients'
import { ClientDetailsSheet } from '@/components/clients/ClientDetailsSheet'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'

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
  instagram: '',
  facebook: '',
  website: '',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client>>(EMPTY_CLIENT)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const records = await pb.collection('clients').getFullList<Client>({ sort: 'name' })
      setClients(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('clients', () => loadData())

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

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setIsSheetOpen(true)
  }

  const confirmDelete = (id: string) => {
    setClientToDelete(id)
    setIsAlertOpen(true)
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

      <div className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[30%]">Cliente</TableHead>
              <TableHead className="w-[25%]">Contato</TableHead>
              <TableHead className="w-[20%]">Telefone</TableHead>
              <TableHead className="w-[15%]">Localidade</TableHead>
              <TableHead className="w-[10%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => handleViewClient(client)}
                >
                  <TableCell>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary/70" /> {client.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 ml-6">
                      <Briefcase className="h-3 w-3" /> {client.cnpj_cpf || 'Não informado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.contact_name || '-'}</div>
                    {client.email && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" /> {client.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{client.phone || '-'}</div>
                    {client.alt_phone && (
                      <div className="text-xs text-muted-foreground mt-1">{client.alt_phone}</div>
                    )}
                  </TableCell>
                  <TableCell>{client.cidade ? `${client.cidade}/${client.uf}` : '-'}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ClientFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={editingClient}
        onSuccess={() => setIsModalOpen(false)}
      />
      <ClientDetailsSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        client={selectedClient}
      />

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
