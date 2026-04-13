import pb from '@/lib/pocketbase/client'

export interface FinancialRecord {
  id: string
  description: string
  amount: number
  type: string
  date: string
  status: string
  reconciled: boolean
  bank_account: string
  created: string
}

export const getAccountTransactions = async (accountId: string) => {
  return pb.collection('financial_records').getFullList<FinancialRecord>({
    filter: `bank_account = "${accountId}"`,
    sort: '-date,-created',
  })
}

export const toggleReconciledStatus = async (id: string, reconciled: boolean) => {
  return pb.collection('financial_records').update(id, { reconciled })
}
