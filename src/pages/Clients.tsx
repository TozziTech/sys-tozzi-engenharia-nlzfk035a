import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Building } from 'lucide-react'

const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'Construtora Alpha',
    contact: 'Carlos Silva',
    email: 'carlos@alpha.com',
    phone: '(11) 98765-4321',
    projects: 3,
  },
  {
    id: 2,
    name: 'Incorporadora Beta',
    contact: 'Ana Gomes',
    email: 'ana@beta.com',
    phone: '(11) 91234-5678',
    projects: 5,
  },
  {
    id: 3,
    name: 'Residencial Gama',
    contact: 'Marcos Oliveira',
    email: 'marcos@gama.com',
    phone: '(11) 99876-5432',
    projects: 1,
  },
  {
    id: 4,
    name: 'Urbanismo Delta',
    contact: 'Juliana Costa',
    email: 'juliana@delta.com',
    phone: '(11) 97654-3210',
    projects: 2,
  },
  {
    id: 5,
    name: 'Engenharia Ômega',
    contact: 'Ricardo Alves',
    email: 'ricardo@omega.com',
    phone: '(11) 96543-2109',
    projects: 4,
  },
]

export default function Clients() {
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Clientes</h1>
        <p className="text-muted-foreground">Gerencie os clientes e contatos da empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CLIENTS.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building className="h-5 w-5 text-slate-400" />
                    {client.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 pt-1 font-medium">
                    <User className="h-4 w-4" />
                    {client.contact}
                  </CardDescription>
                </div>
                <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  {client.projects} {client.projects === 1 ? 'Projeto' : 'Projetos'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 text-sm pt-2">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
