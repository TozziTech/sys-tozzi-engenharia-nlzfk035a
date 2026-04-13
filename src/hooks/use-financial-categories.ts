import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useFinancialCategories() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    pb.collection('financial_categories')
      .getFullList({ sort: 'name' })
      .then(setCategories)
      .catch(console.error)
  }, [])

  useRealtime('financial_categories', (e) => {
    if (e.action === 'create') {
      setCategories((prev) => {
        if (prev.some((c) => c.id === e.record.id)) return prev
        return [...prev, e.record].sort((a, b) => a.name.localeCompare(b.name))
      })
    } else if (e.action === 'update') {
      setCategories((prev) =>
        prev
          .map((c) => (c.id === e.record.id ? e.record : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    } else if (e.action === 'delete') {
      setCategories((prev) => prev.filter((c) => c.id !== e.record.id))
    }
  })

  const addCategory = async (name: string, color?: string) => {
    return await pb.collection('financial_categories').create({ name, color: color || '#6366f1' })
  }

  const deleteCategory = async (id: string) => {
    return await pb.collection('financial_categories').delete(id)
  }

  return { categories, addCategory, deleteCategory }
}
