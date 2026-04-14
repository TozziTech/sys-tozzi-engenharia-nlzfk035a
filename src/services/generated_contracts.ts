import pb from '@/lib/pocketbase/client'
import { ContractTemplate } from './contract_templates'

export interface GeneratedContract {
  id: string
  template: string
  client_name: string
  address: string
  value: number
  deadline: string
  final_content: string
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
