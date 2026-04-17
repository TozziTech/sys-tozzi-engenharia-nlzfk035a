import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MemberFormValues } from '@/lib/schemas/member'
import { handleMaskedChange, maskCEP } from './mask-utils'
import { useToast } from '@/hooks/use-toast'

export function MemberAddressFields({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { toast } = useToast()

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          const opts = { shouldValidate: true, shouldDirty: true }
          form.setValue('logradouro', data.logradouro || '', opts)
          form.setValue('bairro', data.bairro || '', opts)
          form.setValue('cidade', data.localidade || '', opts)
          form.setValue('uf', data.uf || '', opts)
          setTimeout(() => {
            document.getElementById('member-numero')?.focus()
          }, 100)
        } else {
          toast({ title: 'CEP não encontrado', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Erro ao buscar CEP', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <FormField
        control={form.control}
        name="cep"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-3">
            <FormLabel>CEP</FormLabel>
            <FormControl>
              <Input
                placeholder="00000-000"
                maxLength={9}
                autoComplete="off"
                {...field}
                onChange={(e) =>
                  handleMaskedChange(e, maskCEP, (newVal) => {
                    field.onChange(newVal)
                    if (newVal.replace(/\D/g, '').length === 8) {
                      fetchCep(newVal)
                    }
                  })
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="logradouro"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-7">
            <FormLabel>Logradouro</FormLabel>
            <FormControl>
              <Input placeholder="Rua, Avenida..." autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="numero"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-2">
            <FormLabel>Número</FormLabel>
            <FormControl>
              <Input id="member-numero" placeholder="123" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="bairro"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-5">
            <FormLabel>Bairro</FormLabel>
            <FormControl>
              <Input placeholder="Centro" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cidade"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-5">
            <FormLabel>Cidade</FormLabel>
            <FormControl>
              <Input placeholder="São Paulo" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="uf"
        render={({ field }) => (
          <FormItem className="col-span-12 md:col-span-2">
            <FormLabel>UF</FormLabel>
            <FormControl>
              <Input placeholder="SP" maxLength={2} autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
