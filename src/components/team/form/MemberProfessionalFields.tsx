import { UseFormReturn, useWatch } from 'react-hook-form'
import { useAuth } from '@/hooks/use-auth'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberFormValues } from '@/lib/schemas/member'

const FormacaoCustomField = ({ form }: { form: UseFormReturn<MemberFormValues> }) => {
  const formacao = useWatch({ control: form.control, name: 'formacaoSelect' })
  if (formacao !== 'Outros') return null

  return (
    <FormField
      control={form.control}
      name="formacaoCustom"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Especifique a Formação</FormLabel>
          <FormControl>
            <Input placeholder="Sua formação..." autoComplete="off" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function MemberProfessionalFields({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Administrador'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isAdmin && (
        <>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Acesso *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      'Administrador',
                      'Gerente de Projeto',
                      'Projetista',
                      'Estagiário',
                      'Visitante',
                      'Cliente',
                    ].map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['Ativo', 'Inativo', 'Em Férias', 'Pendente'].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      <FormField
        control={form.control}
        name="formacaoSelect"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Formação</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[
                  'Engenheiro Civil',
                  'Engenheiro Elétrico',
                  'Engenheiro Mecânico',
                  'Arquiteto',
                  'Topógrafo',
                  'Outros',
                ].map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormacaoCustomField form={form} />
      <FormField
        control={form.control}
        name="crea"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registro CREA/CAU</FormLabel>
            <FormControl>
              <Input placeholder="123456/UF" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="documents"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem className="md:col-span-1">
            <FormLabel>Documentos Profissionais</FormLabel>
            <FormControl>
              <Input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => onChange(e.target.files)}
                {...field}
              />
            </FormControl>
            <FormDescription>Anexe cópia do CREA, contratos, etc.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="documentos_link"
        render={({ field }) => (
          <FormItem className="md:col-span-1 md:col-start-1">
            <FormLabel>Link de Documentos (Nuvem)</FormLabel>
            <FormControl>
              <Input placeholder="https://drive.google.com/..." autoComplete="off" {...field} />
            </FormControl>
            <FormDescription>Cole o link da pasta de documentos.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
