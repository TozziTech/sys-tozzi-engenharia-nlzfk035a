import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import {
  memberFormSchema,
  type MemberFormValues,
  DEFAULT_MEMBER_VALUES,
} from '@/lib/schemas/member'
import { MemberIdentityFields } from '@/components/team/form/MemberIdentityFields'
import { MemberProfessionalFields } from '@/components/team/form/MemberProfessionalFields'
import { MemberAddressFields } from '@/components/team/form/MemberAddressFields'
import { MemberAdditionalFields } from '@/components/team/form/MemberAdditionalFields'

export default function TeamNew() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: DEFAULT_MEMBER_VALUES,
  })

  const onSubmit = async (data: MemberFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Basic info
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('passwordConfirm', data.password)
      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar)
      }

      // Professional Info
      formData.append('codigo', data.codigo)
      formData.append('crea', data.crea)
      formData.append(
        'formacao',
        data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect,
      )
      formData.append('role', data.role)
      formData.append('status', data.status)
      formData.append('documentos_link', data.documentos_link)

      // Address Info
      formData.append('logradouro', data.logradouro)
      formData.append('numero', data.numero)
      formData.append('bairro', data.bairro)
      formData.append('cidade', data.cidade)
      formData.append('uf', data.uf)
      formData.append('cep', data.cep)

      // Identity & Contact
      formData.append('cpf', data.cpf)
      formData.append('rg', data.rg)
      formData.append('birth_date', data.birth_date)
      formData.append('phone', data.phone)
      formData.append('altPhone', data.altPhone)

      // Financial Info
      formData.append('banco_nome', data.banco_nome)
      formData.append('agencia', data.agencia)
      formData.append('conta', data.conta)
      formData.append('chave_pix', data.chave_pix)

      formData.append('notes', data.notes)

      await pb.collection('users').create(formData)

      toast({
        title: 'Membro criado com sucesso!',
        description: 'O novo profissional foi adicionado à equipe.',
      })
      navigate('/team')
    } catch (error) {
      console.error('Error creating member:', error)
      toast({
        title: 'Erro ao criar membro',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/team')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Membro</h1>
          <p className="text-muted-foreground">Adicione um novo profissional à equipe.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="p-6 border-border/40 shadow-sm">
            <div className="mb-6 border-b border-border/50 pb-4">
              <h2 className="text-lg font-semibold">Identificação e Contato</h2>
              <p className="text-sm text-muted-foreground">
                Dados pessoais básicos do profissional.
              </p>
            </div>
            <MemberIdentityFields form={form} isEdit={false} />
          </Card>

          <Card className="p-6 border-border/40 shadow-sm">
            <div className="mb-6 border-b border-border/50 pb-4">
              <h2 className="text-lg font-semibold">Perfil Profissional e Acesso</h2>
              <p className="text-sm text-muted-foreground">Função, permissões e especialidade.</p>
            </div>
            <MemberProfessionalFields form={form} />
          </Card>

          <Card className="p-6 border-border/40 shadow-sm">
            <div className="mb-6 border-b border-border/50 pb-4">
              <h2 className="text-lg font-semibold">Endereço</h2>
              <p className="text-sm text-muted-foreground">Informações de residência.</p>
            </div>
            <MemberAddressFields form={form} />
          </Card>

          <Card className="p-6 border-border/40 shadow-sm">
            <div className="mb-6 border-b border-border/50 pb-4">
              <h2 className="text-lg font-semibold">Dados Bancários e Observações</h2>
              <p className="text-sm text-muted-foreground">
                Informações financeiras para repasses.
              </p>
            </div>
            <MemberAdditionalFields form={form} />
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/team')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Membro
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
