import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Paintbrush, Highlighter, Undo, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageMarkupEditorProps {
  file: File
  open: boolean
  onClose: () => void
  onSave: (editedFile: File) => void
}

export function ImageMarkupEditor({ file, open, onClose, onSave }: ImageMarkupEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'brush' | 'highlighter'>('brush')
  const [color, setColor] = useState('#ef4444')
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])

  useEffect(() => {
    if (open && file) {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        const MAX_WIDTH = 800
        const MAX_HEIGHT = 600
        let w = img.width
        let h = img.height

        if (w > MAX_WIDTH) {
          h = h * (MAX_WIDTH / w)
          w = MAX_WIDTH
        }
        if (h > MAX_HEIGHT) {
          w = w * (MAX_HEIGHT / h)
          h = MAX_HEIGHT
        }

        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        setHistory([ctx.getImageData(0, 0, w, h)])
      }
      return () => URL.revokeObjectURL(url)
    }
  }, [open, file])

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.beginPath()
        setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)])
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    if ('touches' in e && e.cancelable) {
      e.preventDefault()
    }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)

    ctx.lineWidth = tool === 'brush' ? 4 : 20
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = `${color}40`
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) ctx.putImageData(newHistory[newHistory.length - 1], 0, 0)
      }
    }
  }

  const clear = () => {
    if (history.length > 0) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.putImageData(history[0], 0, 0)
          setHistory([history[0]])
        }
      }
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name, { type: file.type })
        onSave(newFile)
      }
    }, file.type)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg flex-wrap">
            <Button
              variant={tool === 'brush' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setTool('brush')}
              title="Pincel"
            >
              <Paintbrush className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'highlighter' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setTool('highlighter')}
              title="Marca-texto"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000', '#ffffff'].map((c) => (
              <button
                key={c}
                className={cn(
                  'w-6 h-6 rounded-full border-2',
                  color === c ? 'border-primary' : 'border-transparent',
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={history.length <= 1}
              title="Desfazer"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clear}
              disabled={history.length <= 1}
              title="Limpar Tudo"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] touch-none">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[60vh] object-contain cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
