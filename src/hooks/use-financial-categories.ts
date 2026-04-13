import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useFinancialCategories() {
  const [categories, setCategories] = useState<any[]>([])

  const fetchCategories = async () => {
    try {
      const records = await pb.collection('financial_categories').getFullList({ sort: 'name' })
      setCategories(records)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useRealtime('financial_categories', () => {
    fetchCategories()
  })

  const addCategory = async (name: string, color: string, monthly_limit?: number | null) => {
    await pb.collection('financial_categories').create({ name, color, monthly_limit })
  }

  const updateCategory = async (
    id: string,
    name: string,
    color: string,
    monthly_limit?: number | null,
  ) => {
    await pb.collection('financial_categories').update(id, { name, color, monthly_limit })
  }

  const deleteCategory = async (id: string) => {
    await pb.collection('financial_categories').delete(id)
  }

  return { categories, addCategory, updateCategory, deleteCategory }
}
