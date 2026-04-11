import { supabase } from '@/lib/supabase'
import type { QuoteData } from '@/components/QuoteGeneratorModal'

const STORAGE_KEY = '@quotes_mock_data'

const INITIAL_QUOTES: QuoteData[] = [
  {
    id: 'ORC-2023-001',
    clientName: 'Construtora Alpha',
    clientEmail: 'contato@alpha.com',
    projectName: 'Reforma Comercial',
    date: '10/05/2023',
    value: 15000,
    status: 'Aprovado',
    items: [{ id: '1', description: 'Reforma Comercial', quantity: 1, unitPrice: 15000 }],
  },
  {
    id: 'ORC-2023-002',
    clientName: 'Residencial Betel',
    clientEmail: 'diretoria@betel.com',
    projectName: 'Projeto Arquitetônico',
    date: '12/05/2023',
    value: 8500,
    status: 'Pendente',
    items: [{ id: '2', description: 'Projeto Arquitetônico', quantity: 1, unitPrice: 8500 }],
  },
  {
    id: 'ORC-2023-003',
    clientName: 'Prefeitura Municipal',
    clientEmail: 'licitacao@prefeitura.gov.br',
    projectName: 'Paisagismo Praça Central',
    date: '15/05/2023',
    value: 45000,
    status: 'Enviado',
    items: [{ id: '3', description: 'Paisagismo', quantity: 1, unitPrice: 45000 }],
  },
  {
    id: 'ORC-2023-004',
    clientName: 'Clínica Médica Silva',
    clientEmail: 'admin@clinicasilva.com',
    projectName: 'Adequação de Acessibilidade',
    date: '18/05/2023',
    value: 12000,
    status: 'Pendente',
    items: [{ id: '4', description: 'Adequação', quantity: 1, unitPrice: 12000 }],
  },
]

// Default behavior when Supabase is not properly configured
const isMock =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://mock.supabase.co'

function getLocalQuotes(): QuoteData[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUOTES))
  return INITIAL_QUOTES
}

function saveLocalQuote(quote: QuoteData): QuoteData {
  const quotes = getLocalQuotes()
  let newQuotes
  const updatedQuote = { ...quote }
  if (quote.id) {
    newQuotes = quotes.map((q) => (q.id === quote.id ? quote : q))
  } else {
    updatedQuote.id = `ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`
    newQuotes = [updatedQuote, ...quotes]
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuotes))
  return updatedQuote
}

function deleteLocalQuote(id: string) {
  const quotes = getLocalQuotes()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes.filter((q) => q.id !== id)))
}

export const quotesService = {
  async getQuotes(): Promise<QuoteData[]> {
    if (isMock) return getLocalQuotes()
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.warn('Supabase fetch failed, falling back to local storage.', error)
      return getLocalQuotes()
    }
  },

  async saveQuote(quote: QuoteData): Promise<QuoteData> {
    if (isMock) return saveLocalQuote(quote)
    try {
      let result
      if (quote.id) {
        const { data, error } = await supabase
          .from('quotes')
          .update(quote)
          .eq('id', quote.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        const newQuote = {
          ...quote,
          id: `ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0')}`,
        }
        const { data, error } = await supabase.from('quotes').insert([newQuote]).select().single()
        if (error) throw error
        result = data
      }
      return result
    } catch (error) {
      console.warn('Supabase mutation failed, falling back to local storage.', error)
      return saveLocalQuote(quote)
    }
  },

  async deleteQuote(id: string): Promise<void> {
    if (isMock) return deleteLocalQuote(id)
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.warn('Supabase mutation failed, falling back to local storage.', error)
      deleteLocalQuote(id)
    }
  },
}
