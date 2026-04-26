import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Maximize, Minimize } from 'lucide-react'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useAuth } from '@/hooks/use-auth'

export function DensityToggle() {
  const { density, setDensity } = usePreferencesStore()
  const { user } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          {density === 'compact' ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
          <span className="sr-only">Alternar densidade</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setDensity('spaced', user?.id)}>
          <Maximize className="mr-2 h-4 w-4" />
          <span>Espaçado (Padrão)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDensity('compact', user?.id)}>
          <Minimize className="mr-2 h-4 w-4" />
          <span>Compacto</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
