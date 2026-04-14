/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export const maskRG = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{1})\d+?$/, '$1')
}

export const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '')
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false
  const values = cleanCPF.split('').map(Number)
  const rest = (count: number) =>
    ((values.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) *
      10) %
      11) %
    10
  return rest(10) === values[9] && rest(11) === values[10]
}

export const getContrastYIQ = (hexcolor: string) => {
  if (!hexcolor) return 'black'
  hexcolor = hexcolor.replace('#', '')
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(hexcolor.substring(0, 2), 16)
  const g = parseInt(hexcolor.substring(2, 4), 16)
  const b = parseInt(hexcolor.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

export const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  } else {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }
}
