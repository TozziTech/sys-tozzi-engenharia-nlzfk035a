import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function Settings() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências da sua conta e do sistema.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>Atualize suas informações pessoais e de contato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue="Eduardo Costa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" defaultValue="eduardo@archbuild.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo / Ocupação</Label>
              <Input id="role" defaultValue="Gestor de Projetos" disabled className="bg-slate-50" />
            </div>
            <div className="pt-2">
              <Button>Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências de Notificação</CardTitle>
            <CardDescription>Escolha como e quando deseja ser notificado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Resumo Semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Receba um relatório por e-mail com o status geral dos projetos.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Alertas de Atraso</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações imediatas quando uma tarefa ou projeto estiver atrasado.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Atividades da Equipe</Label>
                <p className="text-sm text-muted-foreground">
                  Avisos sobre comentários e mudanças feitas por outros membros.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
