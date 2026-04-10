import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useProjectStore from '@/stores/useProjectStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function Team() {
  const { users, updateUserRole } = useProjectStore()

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground">
          Gerencie os membros da equipe e suas permissões de acesso ao sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros e Permissões</CardTitle>
          <CardDescription>
            Atribua papéis específicos para controlar o que cada usuário pode visualizar ou editar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.substring(0, 2) || 'US'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{user.name}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      Cargo atual:
                      <Badge variant="secondary" className="font-normal text-xs">
                        {user.role || 'Sem cargo'}
                      </Badge>
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-[220px]">
                  <Select
                    value={user.role || ''}
                    onValueChange={(val: any) => updateUserRole(user.id, val)}
                  >
                    <SelectTrigger className="w-full bg-background">
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
