import pb from '@/lib/pocketbase/client'

export interface ContractTemplate {
  id: string
  name: string
  content: string
  email_subject?: string
  email_body?: string
  created: string
  updated: string
}

export const getContractTemplates = () =>
  pb.collection('contract_templates').getFullList<ContractTemplate>({
    sort: '-created',
  })

export const createContractTemplate = (data: Partial<ContractTemplate>) =>
  pb.collection('contract_templates').create<ContractTemplate>(data)

export const updateContractTemplate = (id: string, data: Partial<ContractTemplate>) =>
  pb.collection('contract_templates').update<ContractTemplate>(id, data)

export const deleteContractTemplate = (id: string) => pb.collection('contract_templates').delete(id)
