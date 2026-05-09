import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeAccents(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function fuzzyFilter(value: string, search: string): number {
  if (!search) return 1
  const v = removeAccents(value.toLowerCase())
  const s = removeAccents(search.toLowerCase())

  if (v === s) return 1
  if (v.includes(s)) return 0.5

  const searchWords = s.split(/\s+/).filter(Boolean)
  if (searchWords.length > 0 && searchWords.every((word) => v.includes(word))) {
    return 0.3
  }

  let i = 0
  let j = 0
  while (i < v.length && j < s.length) {
    if (v[i] === s[j]) {
      j++
    }
    i++
  }

  return j === s.length ? 0.1 : 0
}

export function validateCPF(cpf: string) {
  if (!cpf) return false
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  const cpfArray = cpf.split('').map((el) => parseInt(el, 10))
  const rest = (count: number) => {
    return (
      ((cpfArray.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) *
        10) %
        11) %
      10
    )
  }
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10]
}

export function maskCPF(value: string) {
  if (!value) return ''
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function maskRG(value: string) {
  if (!value) return ''
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{1,2})\d+?$/, '$1')
}

export function maskPhone(value: string) {
  if (!value) return ''
  const v = value.replace(/\D/g, '')
  if (v.length === 0) return ''
  if (v.length <= 2) return `(${v}`
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`
}
