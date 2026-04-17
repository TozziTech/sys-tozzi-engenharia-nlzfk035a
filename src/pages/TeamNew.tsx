import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Loader2, Save, UserPlus, FileText, MapPin, Building } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { memberFormSchema, MemberFormValues, DEFAULT_MEMBER_VALUES } from '@/lib/schemas/member'

import { MemberIdentityFields } from '@/components/team/form/MemberIdentityFields'
import { MemberProfessionalFields } from '@/components/team/form/MemberProfessionalFields'
import { MemberAddressFields } from '@/components/team/form/MemberAddressFields'
import { MemberAdditionalFields } from '@/components/team/form/MemberAdditionalFields'

const ROLE_PREFIXES: Record<string, string> = {
  Administrador: 'ADM',
  'Gerente de Projeto': 'GER',
  Projetista: 'PROJ',
  Estagiário: 'ESTG',
  Visitante: 'VIST',
  Cliente: 'CLI',
}

export default function TeamNew() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: DEFAULT_MEMBER_VALUES,
  })

  // Load Draft
  useEffect(() => {
    const draft = localStorage.getItem('memberFormDraft')
    if (draft) {
      try {
        form.reset({ ...DEFAULT_MEMBER_VALUES, ...JSON.parse(draft) })
        toast({
          title: 'Rascunho recuperado',
          description: 'Seus dados não salvos foram restaurados.',
        })
      } catch (e) {
        /* ignore parsing errors */
      }
    }
  }, [form, toast])

  // Subscriptions for Auto-save and Code generation (avoids re-rendering the whole page)
  useEffect(() => {
    let isMounted = true

    const updateCodigo = async (currentRole: string) => {
      const prefix = ROLE_PREFIXES[currentRole] || 'PER'
      try {
        const records = await pb
          .collection('users')
          .getFullList({ filter: `codigo ~ "^${prefix}-"`, fields: 'codigo' })
        let maxNum = 0
        for (const record of records) {
          const match = record.codigo.match(new RegExp(`^${prefix}-(\\d+)`))
          if (match && parseInt(match[1], 10) > maxNum) maxNum = parseInt(match[1], 10)
        }
        if (isMounted) {
          form.setValue('codigo', `${prefix}-${(maxNum + 1).toString().padStart(3, '0')}`, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch (e: any) {
        if (e.status !== 0) console.error('Error fetching codigos', e)
      }
    }

    const subscription = form.watch((value, { name }) => {
      if (name === 'role') {
        updateCodigo(value.role || 'Projetista')
      }
      localStorage.setItem('memberFormDraft', JSON.stringify(value))
    })

    if (!localStorage.getItem('memberFormDraft')) {
      updateCodigo(form.getValues('role') || 'Projetista')
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [form])

  const onSubmit = async (data: MemberFormValues) => {
    setLoading(true)
    const finalFormacao =
      data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

    try {
      const payload: any = {
        ...data,
        formacao: finalFormacao,
        passwordConfirm: data.password,
      }
      if (!data.birth_date) delete payload.birth_date

      await pb.collection('users').create(payload)

      toast({ title: 'Sucesso', description: 'Novo membro registrado com sucesso.' })
      localStorage.removeItem('memberFormDraft')
      navigate('/team')
    } catch (err: any) {
      if (!window.navigator.onLine || err.status === 0) {
        toast({
          title: 'Erro de conexão',
          description: 'Verifique sua internet e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const errors = extractFieldErrors(err)
      let hasFieldError = false
      Object.entries(errors).forEach(([key, msg]) => {
        if (key in data) {
          form.setError(key as keyof MemberFormValues, { type: 'manual', message: msg as string })
          hasFieldError = true
        }
      })

      if (!hasFieldError) {
        toast({
          title: 'Erro ao salvar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const isCodigoValid = !!form.watch('codigo')?.trim()

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/team')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registro de Membro</h1>
            <p className="text-muted-foreground text-sm">
              Adicione um novo profissional preenchendo as informações abaixo.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/team')} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={loading || !isCodigoValid}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Membro
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" /> Identidade & Acesso
              </CardTitle>
              <CardDescription>Dados essenciais e credenciais de login.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberIdentityFields form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" /> Informações Profissionais
              </CardTitle>
              <CardDescription>Função, formação e detalhes técnicos.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberProfessionalFields form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Endereço
              </CardTitle>
              <CardDescription>Localização residencial ou comercial.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberAddressFields form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-primary" /> Dados Bancários e Adicionais
              </CardTitle>
              <CardDescription>Informações financeiras e observações extras.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberAdditionalFields form={form} />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
