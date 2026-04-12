import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

export function TextMaskedInput({
  value,
  onBlur,
  className,
}: {
  value: string
  onBlur: (val: string) => void
  className?: string
}) {
  const [local, setLocal] = useState(value || '')
  useEffect(() => setLocal(value || ''), [value])

  return (
    <Input
      className={
        className ||
        'h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent'
      }
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      onBlur={() => {
        if (local !== (value || '')) {
          onBlur(local)
        }
      }}
    />
  )
}

export function DateMaskedInput({
  value,
  onBlur,
  className,
}: {
  value: string
  onBlur: (val: string) => void
  className?: string
}) {
  const [local, setLocal] = useState(value || '')
  useEffect(() => setLocal(value || ''), [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 8) v = v.substring(0, 8)
    if (v.length > 4) v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`
    else if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`
    setLocal(v)
  }

  return (
    <Input
      className={
        className ||
        'h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent'
      }
      value={local}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      onBlur={() => {
        if (local !== (value || '')) {
          onBlur(local)
        }
      }}
      placeholder="DD/MM/AAAA"
    />
  )
}

export function CurrencyMaskedInput({
  value,
  onBlur,
}: {
  value: any
  onBlur: (val: number | null) => void
}) {
  const format = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const [local, setLocal] = useState(value != null && value !== '' ? format(Number(value)) : '')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) setLocal(value != null && value !== '' ? format(Number(value)) : '')
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (!v) {
      setLocal('')
      return
    }
    setLocal(format(Number(v) / 100))
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (!local) return onBlur(null)
    const numericStr = local.replace(/[^\d,-]/g, '').replace(',', '.')
    onBlur(Number(numericStr))
  }

  return (
    <Input
      className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent text-right"
      value={local}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      placeholder="R$ 0,00"
    />
  )
}
