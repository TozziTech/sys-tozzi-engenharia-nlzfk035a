import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MemberFormValues } from '@/lib/schemas/member'
import { maskCPF, maskRG, maskPhone } from '@/lib/utils'
import { handleMaskedChange } from './mask-utils'

export function MemberIdentityFields({ form }: { form: UseFormReturn<MemberFormValues> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Nome Completo *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: João da Silva" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contato@exemplo.com" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha Provisória *</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="codigo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Código (ID) *</FormLabel>
            <FormControl>
              <Input disabled tabIndex={-1} className="bg-muted font-mono" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="birth_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data de Nascimento</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cpf"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CPF</FormLabel>
            <FormControl>
              <Input
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
                {...field}
                onChange={(e) => handleMaskedChange(e, maskCPF, field.onChange)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="rg"
        render={({ field }) => (
          <FormItem>
            <FormLabel>RG</FormLabel>
            <FormControl>
              <Input
                placeholder="00.000.000-0"
                maxLength={14}
                autoComplete="off"
                {...field}
                onChange={(e) => handleMaskedChange(e, maskRG, field.onChange)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input
                placeholder="(00) 00000-0000"
                maxLength={15}
                autoComplete="off"
                {...field}
                onChange={(e) => handleMaskedChange(e, maskPhone, field.onChange)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="altPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tel. Alternativo</FormLabel>
            <FormControl>
              <Input
                placeholder="(00) 00000-0000"
                maxLength={15}
                autoComplete="off"
                {...field}
                onChange={(e) => handleMaskedChange(e, maskPhone, field.onChange)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
