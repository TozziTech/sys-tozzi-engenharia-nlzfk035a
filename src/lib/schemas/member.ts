import { z } from 'zod'
import { validateCPF } from '@/lib/utils'

export const memberFormSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    codigo: z.string().trim().min(1, 'O código é obrigatório.'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
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
    bank_bank: z.string().optional().default(''),
    bank_agency: z.string().optional().default(''),
    bank_account: z.string().optional().default(''),
    bank_pix: z.string().optional().default(''),
    documentos_link: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  })
  .refine((data) => !data.documentos_link || URL.canParse(data.documentos_link), {
    message: 'Insira uma URL válida.',
    path: ['documentos_link'],
  })
  .refine((data) => !(data.formacaoSelect === 'Outros' && !data.formacaoCustom), {
    message: 'Especifique a formação.',
    path: ['formacaoCustom'],
  })
  .refine(
    (data) => !(data.cpf && data.cpf.replace(/\D/g, '').length > 0 && !validateCPF(data.cpf)),
    { message: 'CPF inválido.', path: ['cpf'] },
  )

export type MemberFormValues = z.infer<typeof memberFormSchema>

export const DEFAULT_MEMBER_VALUES: MemberFormValues = {
  name: '',
  codigo: '',
  password: '',
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
  bank_bank: '',
  bank_agency: '',
  bank_account: '',
  bank_pix: '',
  documentos_link: '',
  notes: '',
}
