import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getClients, type Client } from '@/services/clients'

interface ClientComboboxProps {
  value: string
  onChange: (value: string) => void
}

export function ClientCombobox({ value, onChange }: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [clients, setClients] = React.useState<Client[]>([])
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    getClients()
      .then((data) => {
        if (mounted) setClients(data)
      })
      .catch(console.error)
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          {value ? value : 'Selecione ou digite...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[300px] flex flex-col"
        align="start"
      >
        <Command className="flex-1 min-h-0">
          <CommandInput
            placeholder="Buscar ou adicionar cliente..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onChange(client.name)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === client.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
              {search && !clients.some((c) => c.name.toLowerCase() === search.toLowerCase()) && (
                <CommandItem
                  value={search}
                  onSelect={() => {
                    onChange(search)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Usar "{search}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
