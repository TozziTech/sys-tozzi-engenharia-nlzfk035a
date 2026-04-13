import React, { useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, onImageUpload, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const handleImageClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && onImageUpload) {
        const id = `img-${Date.now()}`
        execCommand(
          'insertHTML',
          `<img id="${id}" src="" alt="Carregando..." style="opacity: 0.5; max-width: 100%; border-radius: 8px; margin: 8px 0;" />`,
        )
        try {
          const url = await onImageUpload(file)
          const img = editorRef.current?.querySelector(`#${id}`) as HTMLImageElement
          if (img) {
            img.src = url
            img.style.opacity = '1'
            img.removeAttribute('id')
            onChange(editorRef.current?.innerHTML || '')
          }
        } catch (err) {
          const img = editorRef.current?.querySelector(`#${id}`) as HTMLImageElement
          if (img) img.remove()
        }
      }
    }
    input.click()
  }

  return (
    <div
      className={`border rounded-md overflow-hidden bg-background flex flex-col ${disabled ? 'opacity-70 pointer-events-none' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('bold')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('formatBlock', 'H1')}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('formatBlock', 'H2')}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('formatBlock', 'H3')}
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('insertUnorderedList')}
          title="Lista com Marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('insertOrderedList')}
          title="Lista Numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleImageClick}
          title="Inserir Imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        className="p-3 min-h-[200px] max-h-[500px] overflow-y-auto outline-none max-w-none focus:ring-2 ring-ring/50 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-2 [&_img]:max-w-full [&_img]:rounded-md"
        contentEditable={!disabled}
        suppressContentEditableWarning={true}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
