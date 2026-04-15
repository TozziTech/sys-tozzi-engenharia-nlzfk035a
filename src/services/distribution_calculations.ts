import pb from '@/lib/pocketbase/client'

export interface DistributionCalculation {
  id: string
  description: string
  total_amount: number
  working_capital_pct: number
  expenses: number
  samuel_pct: number
  tozzi_pct: number
  net_value: number
  samuel_amount: number
  tozzi_amount: number
  date: string
  created: string
  updated: string
}

export const getDistributionCalculations = async () => {
  return pb.collection('distribution_calculations').getFullList<DistributionCalculation>({
    sort: '-date,-created',
  })
}

export const createDistributionCalculation = async (data: Partial<DistributionCalculation>) => {
  return pb.collection('distribution_calculations').create<DistributionCalculation>(data)
}

export const deleteDistributionCalculation = async (id: string) => {
  return pb.collection('distribution_calculations').delete(id)
}
