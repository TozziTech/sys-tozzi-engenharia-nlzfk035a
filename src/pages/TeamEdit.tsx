import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { editMemberFormSchema, EditMemberFormValues } from '@/lib/schemas/member'

import { MemberIdentityFields } from '@/components/team/form/MemberIdentityFields'
import { MemberAddressFields } from '@/components/team/form/MemberAddressFields'
import { MemberProfessionalFields } from '@/components/team/form/MemberProfessionalFields'
import { MemberAdditionalFields } from '@/components/team/form/MemberAdditionalFields'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TeamEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRecord, setUserRecord] = useState<any>(null)
  const [existingDocs, setExistingDocs] = useState<string[]>([])

  const form = useForm<EditMemberFormValues>({
    resolver: zodResolver(editMemberFormSchema),
    defaultValues: {
      name: '',
      codigo: '',
      email: '',
      role: 'Projetista',
      status: 'Ativo',
      crea: '',
      formacaoSelect: 'Engenheiro Civil',
      formacaoCustom: '',
      phone: '',
      altPhone: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      cpf: '',
      rg: '',
      birth_date: '',
      banco_nome: '',
      agencia: '',
      conta: '',
      chave_pix: '',
      documentos_link: '',
      notes: '',
    },
  })

  useEffect(() => {
    async function loadUser() {
      try {
        if (!id) return
        const record = await pb.collection('users').getOne(id)
        setUserRecord(record)
        setExistingDocs(record.documents || [])

        const initialFormacao = record.formacao || ''
        const predefined = [
          'Engenheiro Civil',
          'Engenheiro Elétrico',
          'Engenheiro Mecânico',
          'Arquiteto',
          'Topógrafo',
        ]
        const isPredefined = predefined.includes(initialFormacao)

        form.reset({
          name: record.name || '',
          codigo: record.codigo || '',
          email: record.email || '',
          role: record.role || 'Projetista',
          status: record.status || 'Ativo',
          crea: record.crea || '',
          formacaoSelect: initialFormacao
            ? isPredefined
              ? initialFormacao
              : 'Outros'
            : 'Engenheiro Civil',
          formacaoCustom: !isPredefined && initialFormacao ? initialFormacao : '',
          phone: record.phone || '',
          altPhone: record.altPhone || '',
          logradouro: record.logradouro || '',
          numero: record.numero || '',
          bairro: record.bairro || '',
          cidade: record.cidade || '',
          uf: record.uf || '',
          cep: record.cep || '',
          cpf: record.cpf || '',
          rg: record.rg || '',
          birth_date: record.birth_date ? record.birth_date.substring(0, 10) : '',
          banco_nome: record.banco_nome || '',
          agencia: record.agencia || '',
          conta: record.conta || '',
          chave_pix: record.chave_pix || '',
          documentos_link: record.documentos_link || '',
          notes: record.notes || '',
        })
      } catch (err) {
        toast({
          title: 'Erro ao carregar usuário',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
        navigate('/team')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [id, form, navigate, toast])

  const onSubmit = async (data: EditMemberFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const finalFormacao =
        data.formacaoSelect === 'Outros' ? data.formacaoCustom : data.formacaoSelect

      const formData = new FormData()

      formData.append('name', data.name)
      formData.append('codigo', data.codigo)
      formData.append('email', data.email)
      formData.append('role', data.role)
      formData.append('status', data.status)
      formData.append('crea', data.crea || '')
      formData.append('formacao', finalFormacao || '')
      formData.append('phone', data.phone || '')
      formData.append('altPhone', data.altPhone || '')
      formData.append('logradouro', data.logradouro || '')
      formData.append('numero', data.numero || '')
      formData.append('bairro', data.bairro || '')
      formData.append('cidade', data.cidade || '')
      formData.append('uf', data.uf || '')
      formData.append('cep', data.cep || '')
      formData.append('cpf', data.cpf || '')
      formData.append('rg', data.rg || '')
      if (data.birth_date) {
        formData.append('birth_date', data.birth_date)
      }
      formData.append('banco_nome', data.banco_nome || '')
      formData.append('agencia', data.agencia || '')
      formData.append('conta', data.conta || '')
      formData.append('chave_pix', data.chave_pix || '')
      formData.append('documentos_link', data.documentos_link || '')
      formData.append('notes', data.notes || '')

      if (data.password) {
        formData.append('password', data.password)
        formData.append('passwordConfirm', data.passwordConfirm || data.password)
      }

      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar)
      }

      if (data.documents && data.documents.length > 0) {
        for (let i = 0; i < data.documents.length; i++) {
          formData.append('documents', data.documents[i])
        }
      }

      await pb.collection('users').update(id, formData)

      toast({
        title: 'Sucesso',
        description: 'Membro da equipe atualizado com sucesso.',
      })
      navigate('/team')
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      let hasFieldError = false

      if (fieldErrors.email || err.response?.data?.email?.code === 'validation_not_unique') {
        form.setError('email', { type: 'manual', message: 'Este e-mail já está em uso.' })
        hasFieldError = true
      }
      if (fieldErrors.codigo || err.response?.data?.codigo?.code === 'validation_not_unique') {
        form.setError('codigo', { type: 'manual', message: 'Este código já está em uso.' })
        hasFieldError = true
      }

      for (const [key, msg] of Object.entries(fieldErrors)) {
        if (key !== 'codigo' && key !== 'email' && key in data) {
          form.setError(key as keyof EditMemberFormValues, {
            type: 'manual',
            message: msg as string,
          })
          hasFieldError = true
        }
      }

      if (!hasFieldError || fieldErrors.codigo || fieldErrors.email) {
        toast({
          title: 'Erro ao atualizar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveDoc = async (fileName: string) => {
    if (!confirm('Deseja remover este documento?')) return
    try {
      const updated = await pb.collection('users').update(id!, {
        'documents-': fileName,
      })
      setExistingDocs(updated.documents || [])
      toast({ title: 'Sucesso', description: 'Documento removido com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 pt-6">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Membro</h1>
            <p className="text-muted-foreground">Atualize as informações do colaborador.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4 sm:px-0">
          <Tabs defaultValue="identidade" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identidade">Identidade</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
            </TabsList>

            <TabsContent value="identidade" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                  <CardDescription>Informações básicas e de contato.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberIdentityFields form={form} isEdit user={userRecord} />
                  <div className="mt-6 border-t pt-6 space-y-4">
                    <h3 className="text-lg font-medium">Alterar Senha (Opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Deixe em branco para não alterar"
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
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirme a nova senha"
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endereco" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription>Localização e correspondência.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberAddressFields form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profissional" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Profissionais</CardTitle>
                  <CardDescription>Cargo, formação e acesso ao sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberProfessionalFields form={form} />

                  {existingDocs.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <h4 className="font-semibold text-sm mb-4 text-foreground">
                        Documentos Anexados
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {existingDocs.map((doc) => (
                          <div
                            key={doc}
                            className="flex items-center justify-between p-2 text-sm border rounded-md bg-muted/20"
                          >
                            <a
                              href={pb.files.getURL(userRecord, doc)}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate font-medium hover:underline hover:text-primary pr-2"
                            >
                              {doc}
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveDoc(doc)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adicionais" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Adicionais</CardTitle>
                  <CardDescription>Dados bancários e observações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberAdditionalFields form={form} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 pb-12">
            <Button variant="outline" type="button" onClick={() => navigate('/team')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
