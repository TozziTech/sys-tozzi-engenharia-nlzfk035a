import { User } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import useProjectStore from '@/stores/useProjectStore'
import { ProjetistaDashboard } from './ProjetistaDashboard'

export function ProjetistaCard({ user }: { user: User }) {
  const { projects } = useProjectStore()

  const userProjects = projects.filter((p) => user.assignedProjects?.includes(p.id))

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-col items-center text-center pb-4 bg-muted/40 relative">
        <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name?.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-xl">{user.name}</CardTitle>
        <CardDescription className="text-sm font-medium mt-1">
          {user.specialty || 'Especialidade não definida'}
        </CardDescription>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="bg-background">
            CREA: {user.crea || 'Não informado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-6 space-y-6">
        <div className="text-sm space-y-2">
          <p className="flex justify-between items-center">
            <span className="text-muted-foreground">Email:</span>{' '}
            <span className="font-medium truncate ml-2">{user.email || 'N/A'}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-muted-foreground">Telefone:</span>{' '}
            <span className="font-medium">{user.phone || 'N/A'}</span>
          </p>
          <p className="flex justify-between items-start">
            <span className="text-muted-foreground mr-2">Endereço:</span>{' '}
            <span className="font-medium text-right line-clamp-2">{user.address || 'N/A'}</span>
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold border-b pb-1">
            Projetos Associados ({userProjects.length})
          </h4>
          {userProjects.length > 0 ? (
            <ul className="text-sm space-y-2">
              {userProjects.slice(0, 3).map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center bg-muted/30 p-2 rounded-md"
                >
                  <span className="truncate pr-2 font-medium">{p.name}</span>
                  <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                    {p.status}
                  </Badge>
                </li>
              ))}
              {userProjects.length > 3 && (
                <li className="text-xs text-center text-muted-foreground pt-1">
                  + {userProjects.length - 3} outros projetos
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum projeto associado.</p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold border-b pb-1">Dados Bancários</h4>
          <div className="text-sm grid grid-cols-2 gap-3 bg-muted/50 p-3 rounded-md">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Banco
              </span>{' '}
              {user.bankData?.bank || '-'}
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Agência
              </span>{' '}
              {user.bankData?.agency || '-'}
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Conta
              </span>{' '}
              {user.bankData?.account || '-'}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                PIX
              </span>{' '}
              <span className="truncate block">{user.bankData?.pix || '-'}</span>
            </div>
          </div>
        </div>

        <ProjetistaDashboard user={user} />
      </CardContent>
    </Card>
  )
}
