import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('')
  if (hex.length !== 6) return ''

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function getForegroundHsl(hex: string): string {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('')
  if (hex.length !== 6) return '0 0% 98%'
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '240 5.9% 10%' : '0 0% 98%'
}

export function hexToHslObject(hex: string) {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('')
  if (hex.length !== 6) return { h: 0, s: 0, l: 100 }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function ThemeColorInjector() {
  const [primaryColor, setPrimaryColor] = useState('')
  const [bgColor, setBgColor] = useState('')

  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then((res) => {
        if (res.primary_color) setPrimaryColor(res.primary_color)
        if (res.background_color) setBgColor(res.background_color)
      })
      .catch(() => {}) // Ignore if no settings yet
  }, [])

  useRealtime('company_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setPrimaryColor(e.record.primary_color || '')
      setBgColor(e.record.background_color || '')
    }
  })

  if (!primaryColor && !bgColor) return null

  let customCss = ''

  if (primaryColor) {
    const hsl = hexToHsl(primaryColor)
    const fgHsl = getForegroundHsl(primaryColor)
    if (hsl) {
      customCss += `
        :root, .dark, [data-theme-color] {
          --primary: ${hsl} !important;
          --primary-foreground: ${fgHsl} !important;
          --ring: ${hsl} !important;
          --chart-1: ${hsl} !important;
        }
      `
    }
  }

  if (bgColor) {
    const { h, s, l } = hexToHslObject(bgColor)
    const isDark = l < 50
    const fgL = isDark ? 98 : 10
    const cardL = isDark ? Math.min(100, l + 2) : Math.max(0, l - 2)
    const mutedL = isDark ? Math.min(100, l + 8) : Math.max(0, l - 5)
    const borderL = isDark ? Math.min(100, l + 12) : Math.max(0, l - 10)

    customCss += `
      :root, .dark, [data-theme-color] {
        --background: ${h} ${s}% ${l}% !important;
        --foreground: ${h} ${s}% ${fgL}% !important;
        --card: ${h} ${s}% ${cardL}% !important;
        --card-foreground: ${h} ${s}% ${fgL}% !important;
        --popover: ${h} ${s}% ${cardL}% !important;
        --popover-foreground: ${h} ${s}% ${fgL}% !important;
        --muted: ${h} ${s}% ${mutedL}% !important;
        --muted-foreground: ${h} ${s}% ${isDark ? 70 : 40}% !important;
        --border: ${h} ${s}% ${borderL}% !important;
        --input: ${h} ${s}% ${borderL}% !important;
        --sidebar-background: ${h} ${s}% ${cardL}% !important;
        --sidebar-foreground: ${h} ${s}% ${fgL}% !important;
        --sidebar-border: ${h} ${s}% ${borderL}% !important;
      }
    `
  }

  return <style>{customCss}</style>
}
