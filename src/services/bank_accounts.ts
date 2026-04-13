import pb from '@/lib/pocketbase/client'

export interface BankAccount {
  id: string
  code?: string
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

export const transferFunds = async (data: {
  from_account_id: string
  to_account_id: string
  amount: number
  date: string
  description: string
}) => {
  return pb.send('/backend/v1/bank-accounts/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}
