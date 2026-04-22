import { useState, useEffect } from 'react'
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
import pb from '@/lib/pocketbase/client'

interface EngineerComboboxProps {
  value: string
  onChange: (value: string) => void
}

export function EngineerCombobox({ value, onChange }: EngineerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [engineers, setEngineers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          filter: "role = 'Gerente de Projeto' || role = 'Administrador'",
          sort: 'name',
        })
        setEngineers(
          records
            .filter((r) => r.name)
            .map((r) => ({
              id: r.id,
              name: r.name,
            })),
        )
      } catch (error) {
        console.error('Failed to fetch engineers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEngineers()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={loading}
        >
          {value
            ? engineers.find((e) => e.name === value)?.name || value
            : loading
              ? 'Carregando...'
              : 'Selecione um responsável...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar responsável..." />
          <CommandList>
            <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
            <CommandGroup>
              {engineers.map((engineer) => (
                <CommandItem
                  key={engineer.id}
                  value={engineer.name}
                  onSelect={() => {
                    onChange(engineer.name === value ? '' : engineer.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === engineer.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {engineer.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
