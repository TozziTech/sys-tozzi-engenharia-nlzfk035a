import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useTheme } from 'next-themes'
import usePreviewThemeStore from '@/stores/usePreviewThemeStore'

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
  const [dbPrimaryColor, setDbPrimaryColor] = useState('')
  const [dbBgColor, setDbBgColor] = useState('')

  const previewPrimary = usePreviewThemeStore((s) => s.previewPrimary)
  const previewBg = usePreviewThemeStore((s) => s.previewBg)

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then((res) => {
        if (res.primary_color) setDbPrimaryColor(res.primary_color)
        if (res.background_color) setDbBgColor(res.background_color)
      })
      .catch(() => {})
  }, [])

  useRealtime('company_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setDbPrimaryColor(e.record.primary_color || '')
      setDbBgColor(e.record.background_color || '')
    }
  })

  useEffect(() => {
    const primaryColor = previewPrimary !== null ? previewPrimary : dbPrimaryColor
    const bgColor = previewBg !== null ? previewBg : dbBgColor

    const root = document.documentElement

    const cleanup = () => {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--chart-1')
      root.style.removeProperty('--background')
      root.style.removeProperty('--foreground')
      root.style.removeProperty('--card')
      root.style.removeProperty('--card-foreground')
      root.style.removeProperty('--popover')
      root.style.removeProperty('--popover-foreground')
      root.style.removeProperty('--muted')
      root.style.removeProperty('--muted-foreground')
      root.style.removeProperty('--border')
      root.style.removeProperty('--input')
      root.style.removeProperty('--sidebar-background')
      root.style.removeProperty('--sidebar-foreground')
      root.style.removeProperty('--sidebar-border')
    }

    if (!primaryColor && !bgColor) {
      cleanup()
      return
    }

    if (primaryColor) {
      const { h, s, l } = hexToHslObject(primaryColor)
      const fgHsl = getForegroundHsl(primaryColor)
      const darkPrimaryL = Math.max(0, l - 5)

      const activeL = isDark ? darkPrimaryL : l

      root.style.setProperty('--primary', `${h} ${s}% ${activeL}%`)
      root.style.setProperty('--primary-foreground', fgHsl)
      root.style.setProperty('--ring', `${h} ${s}% ${activeL}%`)
      root.style.setProperty('--chart-1', `${h} ${s}% ${activeL}%`)
    } else {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--chart-1')
    }

    if (bgColor) {
      const { h, s, l } = hexToHslObject(bgColor)

      if (isDark) {
        const darkL = Math.max(12, Math.min(16, l * 0.2))
        const fgL_dark = 88
        const cardL_dark = Math.min(100, darkL + 3)
        const mutedL_dark = Math.min(100, darkL + 8)
        const borderL_dark = Math.min(100, darkL + 13)

        root.style.setProperty('--background', `${h} ${s}% ${darkL}%`)
        root.style.setProperty('--foreground', `${h} ${s}% ${fgL_dark}%`)
        root.style.setProperty('--card', `${h} ${s}% ${cardL_dark}%`)
        root.style.setProperty('--card-foreground', `${h} ${s}% ${fgL_dark}%`)
        root.style.setProperty('--popover', `${h} ${s}% ${cardL_dark}%`)
        root.style.setProperty('--popover-foreground', `${h} ${s}% ${fgL_dark}%`)
        root.style.setProperty('--muted', `${h} ${s}% ${mutedL_dark}%`)
        root.style.setProperty('--muted-foreground', `${h} ${s}% 64%`)
        root.style.setProperty('--border', `${h} ${s}% ${borderL_dark}%`)
        root.style.setProperty('--input', `${h} ${s}% ${borderL_dark}%`)
        root.style.setProperty('--sidebar-background', `${h} ${s}% ${cardL_dark}%`)
        root.style.setProperty('--sidebar-foreground', `${h} ${s}% ${fgL_dark}%`)
        root.style.setProperty('--sidebar-border', `${h} ${s}% ${borderL_dark}%`)
      } else {
        const fgL_light = l < 50 ? 98 : 15
        const cardL_light = Math.max(0, l - 2)
        const mutedL_light = Math.max(0, l - 5)
        const borderL_light = Math.max(0, l - 10)

        root.style.setProperty('--background', `${h} ${s}% ${l}%`)
        root.style.setProperty('--foreground', `${h} ${s}% ${fgL_light}%`)
        root.style.setProperty('--card', `${h} ${s}% ${cardL_light}%`)
        root.style.setProperty('--card-foreground', `${h} ${s}% ${fgL_light}%`)
        root.style.setProperty('--popover', `${h} ${s}% ${cardL_light}%`)
        root.style.setProperty('--popover-foreground', `${h} ${s}% ${fgL_light}%`)
        root.style.setProperty('--muted', `${h} ${s}% ${mutedL_light}%`)
        root.style.setProperty('--muted-foreground', `${h} ${s}% 40%`)
        root.style.setProperty('--border', `${h} ${s}% ${borderL_light}%`)
        root.style.setProperty('--input', `${h} ${s}% ${borderL_light}%`)
        root.style.setProperty('--sidebar-background', `${h} ${s}% ${cardL_light}%`)
        root.style.setProperty('--sidebar-foreground', `${h} ${s}% ${fgL_light}%`)
        root.style.setProperty('--sidebar-border', `${h} ${s}% ${borderL_light}%`)
      }
    } else {
      root.style.removeProperty('--background')
      root.style.removeProperty('--foreground')
      root.style.removeProperty('--card')
      root.style.removeProperty('--card-foreground')
      root.style.removeProperty('--popover')
      root.style.removeProperty('--popover-foreground')
      root.style.removeProperty('--muted')
      root.style.removeProperty('--muted-foreground')
      root.style.removeProperty('--border')
      root.style.removeProperty('--input')
      root.style.removeProperty('--sidebar-background')
      root.style.removeProperty('--sidebar-foreground')
      root.style.removeProperty('--sidebar-border')
    }
  }, [dbPrimaryColor, dbBgColor, previewPrimary, previewBg, isDark])

  return null
}
