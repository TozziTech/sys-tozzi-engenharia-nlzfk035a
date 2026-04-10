import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useState } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { useThemeColor } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { slackWebhookUrl, setSlackWebhookUrl } = useProjectStore()
  const [webhookInput, setWebhookInput] = useState(slackWebhookUrl)
  const { toast } = useToast()

  const { theme, setTheme } = useTheme()
  const { themeColor, setThemeColor } = useThemeColor()

  const colors = [
    { name: 'Zinc', value: 'zinc', colorClass: 'bg-zinc-900 dark:bg-zinc-100' },
    { name: 'Blue', value: 'blue', colorClass: 'bg-blue-600' },
    { name: 'Green', value: 'green', colorClass: 'bg-green-600' },
    { name: 'Rose', value: 'rose', colorClass: 'bg-rose-600' },
    { name: 'Orange', value: 'orange', colorClass: 'bg-orange-500' },
  ] as const

  const handleSaveSlack = () => {
    setSlackWebhookUrl(webhookInput)
    toast({
      title: 'Integração atualizada',
      description: 'A configuração do Webhook do Slack foi salva.',
    })
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie as preferências da sua conta e do sistema.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize o tema e as cores da interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base">Modo de Exibição</Label>
                <RadioGroup
                  defaultValue={theme}
                  value={theme}
                  onValueChange={(val) => setTheme(val)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="light" id="light" className="peer sr-only" />
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      Claro
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      Escuro
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="system" id="system" className="peer sr-only" />
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      Sistema
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base">Cor Primária</Label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setThemeColor(c.value)}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                        themeColor === c.value
                          ? 'border-primary scale-110 shadow-sm'
                          : 'border-transparent hover:scale-105',
                      )}
                      aria-label={`Selecionar cor ${c.name}`}
                    >
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full border border-black/10 dark:border-white/10',
                          c.colorClass,
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Input
                id="role"
                defaultValue="Gestor de Projetos"
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
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
