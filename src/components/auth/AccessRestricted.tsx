import { ShieldAlert, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function AccessRestricted() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[60vh]">
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card max-w-md w-full shadow-sm animate-fade-in-up">
        <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-3">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          Você não tem permissão para acessar esta área. Entre em contato com o administrador.
        </p>
        <Button
          asChild
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  )
}
