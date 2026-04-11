import pb from '@/lib/pocketbase/client'
import type { QuoteData } from '@/components/QuoteGeneratorModal'

export const quotesService = {
  async getQuotes(): Promise<QuoteData[]> {
    try {
      const records = await pb.collection('quotes').getFullList({ sort: '-created' })
      return records.map((r: any) => ({
        id: r.id,
        clientName: r.client_name,
        clientEmail: r.client_email,
        projectName: r.project_name,
        items: r.items || [],
        value: r.total_amount,
        status: r.status,
        date: r.date,
        deadline: r.deadline ? new Date(r.deadline) : undefined,
        paymentMethod: r.payment_method,
        includedItems: r.included_items,
        notIncludedItems: r.not_included_items,
        observations: r.observations,
        attachments: r.attachments || [],
      }))
    } catch (e) {
      console.warn('PocketBase fetch failed', e)
      return []
    }
  },

  async saveQuote(quote: QuoteData): Promise<QuoteData> {
    const formData = new FormData()

    formData.append('client_name', quote.clientName)
    if (quote.clientEmail) formData.append('client_email', quote.clientEmail)
    if (quote.projectName) formData.append('project_name', quote.projectName)

    formData.append('items', JSON.stringify(quote.items || []))

    if (quote.value !== undefined) formData.append('total_amount', quote.value.toString())
    if (quote.status) formData.append('status', quote.status)
    if (quote.date) formData.append('date', quote.date)
    if (quote.deadline) formData.append('deadline', quote.deadline.toISOString())
    if (quote.paymentMethod) formData.append('payment_method', quote.paymentMethod)
    if (quote.includedItems) formData.append('included_items', quote.includedItems)
    if (quote.notIncludedItems) formData.append('not_included_items', quote.notIncludedItems)
    if (quote.observations) formData.append('observations', quote.observations)

    if (quote.attachments && quote.attachments.length > 0) {
      quote.attachments.forEach((att) => {
        formData.append('attachments', att)
      })
    } else {
      // Clear attachments field if empty
      formData.append('attachments', '')
    }

    if (quote.id && !quote.id.startsWith('ORC-')) {
      const record = await pb.collection('quotes').update(quote.id, formData)
      return { ...quote, id: record.id, attachments: record.attachments }
    } else {
      const record = await pb.collection('quotes').create(formData)
      return { ...quote, id: record.id, attachments: record.attachments }
    }
  },

  async deleteQuote(id: string): Promise<void> {
    await pb.collection('quotes').delete(id)
  },
}
