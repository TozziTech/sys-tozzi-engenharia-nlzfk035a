import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  X,
  Star,
  Building2,
  Phone,
  Mail,
  MapPin,
  AlignLeft,
  MessageCircle,
} from 'lucide-react'

const getWhatsAppUrl = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '#'
  const withCountry = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}`
}
import { getContacts, deleteContact, updateContact, type Contact } from '@/services/contacts'
import { useRealtime } from '@/hooks/use-realtime'
import { exportContactsCSV } from '@/lib/export'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ContactDialog } from '@/components/contacts/ContactDialog'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportContactsDialog } from '@/components/contacts/ImportContactsDialog'
import { ContactHistoryTab } from '@/components/contacts/ContactHistoryTab'
import { Upload } from 'lucide-react'

export default function Contacts() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: 'code' | 'name' | null
    dir: 'asc' | 'desc'
  }>({ key: null, dir: 'asc' })

  const handleNew = () => {
    setEditingContact(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingContact) return
    try {
      await deleteContact(deletingContact.id)
      toast({ title: 'Sucesso', description: 'Contato excluído com sucesso.' })
      if (viewingContact?.id === deletingContact.id) {
        setViewingContact(null)
      }
      loadContacts()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o contato.',
        variant: 'destructive',
      })
    } finally {
      setDeletingContact(null)
    }
  }

  const loadContacts = async () => {
    try {
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const toggleFavorite = async (contact: Contact) => {
    const newIsFavorite = !contact.is_favorite
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, is_favorite: newIsFavorite } : c)),
    )
    try {
      await updateContact(contact.id, { is_favorite: newIsFavorite })
      toast({
        title: 'Sucesso',
        description: newIsFavorite
          ? 'Contato adicionado aos favoritos.'
          : 'Contato removido dos favoritos.',
      })
    } catch (error) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, is_favorite: !newIsFavorite } : c)),
      )
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      })
    }
  }

  const handleExport = () => {
    try {
      exportContactsCSV(contacts)
      toast({ title: 'Sucesso', description: 'Exportação concluída.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  useRealtime('contacts', () => {
    loadContacts()
  })

  const handleSort = (key: 'code' | 'name') => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const filteredContacts = contacts
    .filter((c) => {
      const s = search.toLowerCase()
      const matchesSearch =
        c.name.toLowerCase().includes(s) ||
        c.code?.toLowerCase().includes(s) ||
        c.company?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortConfig.key) {
        const valA = String(a[sortConfig.key] || '')
        const valB = String(b[sortConfig.key] || '')
        return sortConfig.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      if (a.is_favorite === b.is_favorite) {
        return a.name.localeCompare(b.name)
      }
      return a.is_favorite ? -1 : 1
    })

  const hasFilters = search !== '' || categoryFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
  }

  const getCategoryColor = (cat: string) => {
    const norm = cat?.toLowerCase() || ''
    if (norm.includes('cliente'))
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    if (norm.includes('fornecedor'))
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    if (norm.includes('parceiro'))
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
  }

  const existingCategories = Array.from(new Set(contacts.map((c) => c.category).filter(Boolean)))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contatos</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar (nome, código, empresa)..."
                className="pl-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {existingCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                title="Limpar"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpar Filtros</span>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="w-full sm:w-auto flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto flex-1">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleNew} className="w-full sm:w-auto flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Lista de Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('code')}
                  >
                    Código {sortConfig.key === 'code' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    Nome {sortConfig.key === 'name' && (sortConfig.dir === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum contato encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setViewingContact(contact)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(contact)}
                        >
                          <Star
                            className={cn(
                              'h-4 w-4',
                              contact.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground',
                            )}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {contact.code || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.company || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            getCategoryColor(contact.category),
                          )}
                        >
                          {contact.category}
                        </span>
                      </TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingContact(contact)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!viewingContact} onOpenChange={(open) => !open && setViewingContact(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {viewingContact && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-2xl flex items-center gap-2">
                      {viewingContact.name}
                    </SheetTitle>
                    <SheetDescription className="text-base mt-1 flex items-center">
                      {viewingContact.code && (
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold font-mono bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mr-2">
                          {viewingContact.code}
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          getCategoryColor(viewingContact.category),
                        )}
                      >
                        {viewingContact.category}
                      </span>
                    </SheetDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      handleEdit(viewingContact)
                      setViewingContact(null)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  {viewingContact.company && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Empresa</p>
                        <p className="text-sm text-muted-foreground">{viewingContact.company}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Telefones</p>
                      {viewingContact.phone ? (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-muted-foreground">
                            {viewingContact.phone} (Principal)
                          </p>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            asChild
                          >
                            <a
                              href={getWhatsAppUrl(viewingContact.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar no WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3 text-green-600 dark:text-green-500" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-1">
                          Não informado (Principal)
                        </p>
                      )}
                      {viewingContact.alt_phone && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {viewingContact.alt_phone} (Alternativo)
                          </p>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            asChild
                          >
                            <a
                              href={getWhatsAppUrl(viewingContact.alt_phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar no WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3 text-green-600 dark:text-green-500" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">E-mail</p>
                      <p className="text-sm text-muted-foreground">
                        {viewingContact.email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Endereço Completo</p>
                      <p className="text-sm text-muted-foreground break-words">
                        {viewingContact.address || 'Nenhum endereço cadastrado.'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <AlignLeft className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Observações</p>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                        {viewingContact.notes || 'Nenhuma observação registrada.'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <ContactHistoryTab contactId={viewingContact.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadContacts}
        contact={editingContact}
        existingCategories={existingCategories}
      />

      <ImportContactsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={loadContacts}
      />

      <AlertDialog
        open={!!deletingContact}
        onOpenChange={(open) => !open && setDeletingContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato <strong>{deletingContact?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
