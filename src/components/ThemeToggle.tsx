import { Moon, Sun, Palette, Check, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { useThemeColor } from './ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { themeColor, setThemeColor } = useThemeColor()

  const colors = [
    { name: 'Zinc', value: 'zinc', colorClass: 'bg-zinc-900 dark:bg-zinc-100' },
    { name: 'Blue', value: 'blue', colorClass: 'bg-blue-600' },
    { name: 'Green', value: 'green', colorClass: 'bg-green-600' },
    { name: 'Rose', value: 'rose', colorClass: 'bg-rose-600' },
    { name: 'Orange', value: 'orange', colorClass: 'bg-orange-500' },
    { name: 'Gold', value: 'gold', colorClass: 'bg-[#D4AF37]' },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Palette className="h-5 w-5 transition-all" />
          <span className="sr-only">Personalizar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Modo</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            Claro
            {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            Escuro
            {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
            <Monitor className="mr-2 h-4 w-4" />
            Sistema
            {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Cor Primária</DropdownMenuLabel>
        <DropdownMenuGroup>
          {colors.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => setThemeColor(c.value)}
              className="cursor-pointer flex items-center"
            >
              <div className={cn('mr-2 h-4 w-4 rounded-full border border-border', c.colorClass)} />
              {c.name}
              {themeColor === c.value && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
