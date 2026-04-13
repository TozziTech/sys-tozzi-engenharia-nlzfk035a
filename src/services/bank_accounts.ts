import pb from '@/lib/pocketbase/client'

export interface BankAccount {
  id: string
  name: string
  bank_name: string
  agency?: string
  account_number?: string
  balance: number
  type: 'Corrente' | 'Poupança' | 'Investimento'
  created: string
  updated: string
}

export const getBankAccounts = async () => {
  return pb.collection('bank_accounts').getFullList<BankAccount>({
    sort: '-created',
  })
}

export const createBankAccount = async (data: Partial<BankAccount>) => {
  return pb.collection('bank_accounts').create<BankAccount>(data)
}

export const updateBankAccount = async (id: string, data: Partial<BankAccount>) => {
  return pb.collection('bank_accounts').update<BankAccount>(id, data)
}

export const deleteBankAccount = async (id: string) => {
  return pb.collection('bank_accounts').delete(id)
}
