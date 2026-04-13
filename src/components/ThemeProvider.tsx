import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeColor = 'zinc' | 'blue' | 'green' | 'rose' | 'orange' | 'gold'

interface ThemeColorContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
}

export const ThemeColorContext = React.createContext<ThemeColorContextType | undefined>(undefined)

export function useThemeColor() {
  const context = React.useContext(ThemeColorContext)
  if (!context) {
    throw new Error('useThemeColor must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [themeColor, setThemeColor] = React.useState<ThemeColor>(() => {
    return (localStorage.getItem('theme-color') as ThemeColor) || 'gold'
  })

  React.useEffect(() => {
    localStorage.setItem('theme-color', themeColor)
    document.documentElement.setAttribute('data-theme-color', themeColor)
  }, [themeColor])

  return (
    <NextThemesProvider {...props}>
      <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
        {children}
      </ThemeColorContext.Provider>
    </NextThemesProvider>
  )
}
