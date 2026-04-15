import { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useChartColors(chartId: string, defaultColors: Record<string, string>) {
  const [colors, setColors] = useState<Record<string, string>>(defaultColors)
  const settingsIdRef = useRef<string>('')
  const allColorsRef = useRef<any>({})

  useEffect(() => {
    pb.collection('company_settings')
      .getFullList()
      .then((res) => {
        if (res.length > 0) {
          settingsIdRef.current = res[0].id
          const dbColors = res[0].chart_colors || {}
          allColorsRef.current = dbColors
          if (dbColors[chartId]) {
            setColors((prev) => ({ ...prev, ...dbColors[chartId] }))
          }
        }
      })
      .catch(() => {})
  }, [chartId])

  useRealtime('company_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      settingsIdRef.current = e.record.id
      const dbColors = e.record.chart_colors || {}
      allColorsRef.current = dbColors
      if (dbColors[chartId]) {
        setColors((prev) => ({ ...prev, ...dbColors[chartId] }))
      }
    }
  })

  const updateColor = async (seriesId: string, color: string) => {
    const newColors = { ...colors, [seriesId]: color }
    setColors(newColors)

    const newAllColors = {
      ...allColorsRef.current,
      [chartId]: newColors,
    }
    allColorsRef.current = newAllColors

    if (settingsIdRef.current) {
      try {
        await pb
          .collection('company_settings')
          .update(settingsIdRef.current, { chart_colors: newAllColors })
      } catch (e) {
        console.error(e)
      }
    }
  }

  return { colors, updateColor }
}
