import { z } from 'zod'
import { validateCPF } from '@/lib/utils'

export const baseMemberSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  codigo: z.string().trim().min(1, 'O código é obrigatório.'),
  email: z.string().email('Email inválido.').min(1, 'O email é obrigatório.'),
  role: z
    .enum([
      'Administrador',
      'Gerente de Projeto',
      'Projetista',
      'Estagiário',
      'Visitante',
      'Cliente',
    ])
    .default('Projetista'),
  status: z.enum(['Ativo', 'Inativo', 'Em Férias', 'Pendente']).default('Ativo'),
  crea: z.string().optional().default(''),
  formacaoSelect: z.string().default('Engenheiro Civil'),
  formacaoCustom: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  altPhone: z.string().optional().default(''),
  logradouro: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  bairro: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  uf: z.string().optional().default(''),
  cep: z.string().optional().default(''),
  cpf: z.string().optional().default(''),
  rg: z.string().optional().default(''),
  birth_date: z.string().optional().default(''),
  banco_nome: z.string().optional().default(''),
  agencia: z.string().optional().default(''),
  conta: z.string().optional().default(''),
  chave_pix: z.string().optional().default(''),
  avatar: z.any().optional(),
  documentos_link: z.string().optional().default(''),
  documents: z.any().optional(),
  notes: z.string().optional().default(''),
})

const refinements = (schema: z.ZodType<any, any, any>) =>
  schema
    .refine((data: any) => !data.documentos_link || URL.canParse(data.documentos_link), {
      message: 'Insira uma URL válida.',
      path: ['documentos_link'],
    })
    .refine((data: any) => !(data.formacaoSelect === 'Outros' && !data.formacaoCustom), {
      message: 'Especifique a formação.',
      path: ['formacaoCustom'],
    })
    .refine(
      (data: any) =>
        !(data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validateCPF(data.cpf)),
      { message: 'CPF inválido.', path: ['cpf'] },
    )

export const memberFormSchema = refinements(
  baseMemberSchema.extend({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
    passwordConfirm: z.string().min(8, 'A confirmação de senha é obrigatória.'),
  }),
).refine((data: any) => data.password === data.passwordConfirm, {
  message: 'As senhas não coincidem.',
  path: ['passwordConfirm'],
})

export const editMemberFormSchema = refinements(
  baseMemberSchema.extend({
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
  }),
).refine(
  (data: any) => {
    if (data.password && data.password !== data.passwordConfirm) {
      return false
    }
    return true
  },
  {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirm'],
  },
)

export type MemberFormValues = z.infer<typeof memberFormSchema>
export type EditMemberFormValues = z.infer<typeof editMemberFormSchema>

export const DEFAULT_MEMBER_VALUES: MemberFormValues = {
  name: '',
  codigo: '',
  password: '',
  passwordConfirm: '',
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
  avatar: undefined,
  documentos_link: '',
  documents: undefined,
  notes: '',
}
