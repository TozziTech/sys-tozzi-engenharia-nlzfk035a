import pb from '@/lib/pocketbase/client'
import { ContractTemplate } from './contract_templates'

export interface GeneratedContract {
  id: string
  template: string
  client_name: string
  client_email?: string
  address: string
  value: number
  deadline: string
  final_content: string
  email_subject?: string
  email_body?: string
  created: string
  updated: string
  expand?: {
    template?: ContractTemplate
  }
}

export const getGeneratedContracts = () =>
  pb.collection('generated_contracts').getFullList<GeneratedContract>({
    sort: '-created',
    expand: 'template',
  })

export const createGeneratedContract = (data: Partial<GeneratedContract>) =>
  pb.collection('generated_contracts').create<GeneratedContract>(data)

export const sendContractEmail = (
  to: string,
  content: string,
  clientName: string,
  subject?: string,
  body?: string,
) =>
  pb.send('/backend/v1/contracts/send-email', {
    method: 'POST',
    body: JSON.stringify({ to, content, clientName, subject, body }),
    headers: { 'Content-Type': 'application/json' },
  })
