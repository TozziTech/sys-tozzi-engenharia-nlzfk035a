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
    const { h, s, l } = hexToHslObject(primaryColor)
    const fgHsl = getForegroundHsl(primaryColor)
    const darkPrimaryL = Math.max(0, l - 5)

    customCss += `
      :root, [data-theme-color] {
        --primary: ${h} ${s}% ${l}%;
        --primary-foreground: ${fgHsl};
        --ring: ${h} ${s}% ${l}%;
        --chart-1: ${h} ${s}% ${l}%;
      }
      .dark, .dark[data-theme-color] {
        --primary: ${h} ${s}% ${darkPrimaryL}%;
        --primary-foreground: ${fgHsl};
        --ring: ${h} ${s}% ${darkPrimaryL}%;
        --chart-1: ${h} ${s}% ${darkPrimaryL}%;
      }
    `
  }

  if (bgColor) {
    const { h, s, l } = hexToHslObject(bgColor)

    const fgL_light = l < 50 ? 98 : 10
    const cardL_light = Math.max(0, l - 2)
    const mutedL_light = Math.max(0, l - 5)
    const borderL_light = Math.max(0, l - 10)

    const darkL = Math.min(12, l * 0.2)
    const fgL_dark = 98
    const cardL_dark = Math.min(100, darkL + 3)
    const mutedL_dark = Math.min(100, darkL + 8)
    const borderL_dark = Math.min(100, darkL + 12)

    customCss += `
      :root, [data-theme-color] {
        --background: ${h} ${s}% ${l}%;
        --foreground: ${h} ${s}% ${fgL_light}%;
        --card: ${h} ${s}% ${cardL_light}%;
        --card-foreground: ${h} ${s}% ${fgL_light}%;
        --popover: ${h} ${s}% ${cardL_light}%;
        --popover-foreground: ${h} ${s}% ${fgL_light}%;
        --muted: ${h} ${s}% ${mutedL_light}%;
        --muted-foreground: ${h} ${s}% 40%;
        --border: ${h} ${s}% ${borderL_light}%;
        --input: ${h} ${s}% ${borderL_light}%;
        --sidebar-background: ${h} ${s}% ${cardL_light}%;
        --sidebar-foreground: ${h} ${s}% ${fgL_light}%;
        --sidebar-border: ${h} ${s}% ${borderL_light}%;
      }
      .dark, .dark[data-theme-color] {
        --background: ${h} ${s}% ${darkL}%;
        --foreground: ${h} ${s}% ${fgL_dark}%;
        --card: ${h} ${s}% ${cardL_dark}%;
        --card-foreground: ${h} ${s}% ${fgL_dark}%;
        --popover: ${h} ${s}% ${cardL_dark}%;
        --popover-foreground: ${h} ${s}% ${fgL_dark}%;
        --muted: ${h} ${s}% ${mutedL_dark}%;
        --muted-foreground: ${h} ${s}% 70%;
        --border: ${h} ${s}% ${borderL_dark}%;
        --input: ${h} ${s}% ${borderL_dark}%;
        --sidebar-background: ${h} ${s}% ${cardL_dark}%;
        --sidebar-foreground: ${h} ${s}% ${fgL_dark}%;
        --sidebar-border: ${h} ${s}% ${borderL_dark}%;
      }
    `
  }

  return <style>{customCss}</style>
}
