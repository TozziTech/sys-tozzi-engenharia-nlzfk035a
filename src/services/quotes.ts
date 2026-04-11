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
      }))
    } catch (e) {
      console.warn('PocketBase fetch failed', e)
      return []
    }
  },

  async saveQuote(quote: QuoteData): Promise<QuoteData> {
    const payload = {
      client_name: quote.clientName,
      client_email: quote.clientEmail,
      project_name: quote.projectName,
      items: quote.items,
      total_amount: quote.value,
      status: quote.status,
      date: quote.date,
      deadline: quote.deadline ? quote.deadline.toISOString() : null,
      payment_method: quote.paymentMethod,
      included_items: quote.includedItems,
      not_included_items: quote.notIncludedItems,
      observations: quote.observations,
    }

    if (quote.id && !quote.id.startsWith('ORC-')) {
      const record = await pb.collection('quotes').update(quote.id, payload)
      return { ...quote, id: record.id }
    } else {
      const record = await pb.collection('quotes').create(payload)
      return { ...quote, id: record.id }
    }
  },

  async deleteQuote(id: string): Promise<void> {
    await pb.collection('quotes').delete(id)
  },
}
