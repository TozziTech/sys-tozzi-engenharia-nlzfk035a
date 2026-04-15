import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Check } from 'lucide-react'

const PRESETS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#64748b',
  '#0ea5e9',
  '#d946ef',
  '#14b8a6',
  '#f97316',
]

interface ChartColorPickerProps {
  config: Array<{ id: string; label: string; color: string }>
  onChange: (id: string, color: string) => void
}

export function ChartColorPicker({ config, onChange }: ChartColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Palette className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {config.map((item) => {
            const safeColor =
              item.color?.startsWith('#') && (item.color.length === 7 || item.color.length === 4)
                ? item.color
                : '#000000'
            return (
              <div key={item.id} className="space-y-2">
                <Label className="text-xs font-semibold">{item.label}</Label>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        className="w-5 h-5 rounded-full flex items-center justify-center border border-border/50 transition-transform hover:scale-110"
                        style={{ backgroundColor: p }}
                        onClick={() => onChange(item.id, p)}
                        title={p}
                      >
                        {item.color?.toLowerCase() === p.toLowerCase() && (
                          <Check className="h-3 w-3 text-white mix-blend-difference" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={safeColor}
                      onChange={(e) => onChange(item.id, e.target.value)}
                      className="w-8 h-8 p-1 cursor-pointer rounded-md border-border/50 shrink-0"
                    />
                    <Input
                      type="text"
                      value={item.color}
                      onChange={(e) => onChange(item.id, e.target.value)}
                      className="flex-1 h-8 text-xs font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
