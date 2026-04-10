import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { slackWebhookUrl, setSlackWebhookUrl } = useProjectStore()
  const [webhookInput, setWebhookInput] = useState(slackWebhookUrl)
  const { toast } = useToast()

  const handleSaveSlack = () => {
    setSlackWebhookUrl(webhookInput)
    toast({
      title: 'Integração atualizada',
      description: 'A configuração do Webhook do Slack foi salva.',
    })
  }

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
            <CardTitle>Integrações</CardTitle>
            <CardDescription>Configure conexões com aplicativos externos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Slack Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Envie alertas automáticos para um canal do Slack.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveSlack}>Salvar</Button>
              </div>
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
