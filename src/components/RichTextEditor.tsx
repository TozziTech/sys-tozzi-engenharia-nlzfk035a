import React, { useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onImageUpload?: (file: File) => Promise<string>
  disabled?: boolean
  className?: string
}

let globalSavedRange: Range | null = null
let globalActiveEditor: HTMLDivElement | null = null

export function RichTextEditor({
  value,
  onChange,
  onFocus,
  onBlur,
  onImageUpload,
  disabled,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialValueRef = useRef(value)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection()
      const hasSelectionInEditor =
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.getRangeAt(0).commonAncestorContainer)

      if (!editorRef.current.contains(document.activeElement) && !hasSelectionInEditor) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (globalActiveEditor === editorRef.current && globalSavedRange) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(globalSavedRange)
          document.execCommand('insertHTML', false, customEvent.detail)
          editorRef.current.focus()
          onChange(editorRef.current.innerHTML || '')

          const newSelection = window.getSelection()
          if (newSelection && newSelection.rangeCount > 0) {
            globalSavedRange = newSelection.getRangeAt(0)
          }
        }
      }
    }
    document.addEventListener('insert-editor-html', handleInsert)
    return () => document.removeEventListener('insert-editor-html', handleInsert)
  }, [onChange])

  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        globalSavedRange = range
        globalActiveEditor = editorRef.current
      }
    }
  }

  const execCommand = (command: string, arg?: string) => {
    editorRef.current?.focus()
    if (globalActiveEditor === editorRef.current && globalSavedRange) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(globalSavedRange)
      }
    }
    document.execCommand(command, false, arg)
    onChange(editorRef.current?.innerHTML || '')
    saveSelection()
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
      className={`border rounded-md overflow-hidden bg-background flex flex-col ${disabled ? 'opacity-70 pointer-events-none' : ''} ${className}`}
    >
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/30">
        <Select onValueChange={(val) => execCommand('fontSize', val)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Pequeno</SelectItem>
            <SelectItem value="3">Normal</SelectItem>
            <SelectItem value="5">Grande</SelectItem>
            <SelectItem value="7">Gigante</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('underline')}
          title="Sublinhado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('justifyLeft')}
          title="Alinhar à Esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('justifyCenter')}
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('justifyRight')}
          title="Alinhar à Direita"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('justifyFull')}
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          className="h-8 w-8 text-red-600"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            execCommand(
              'insertHTML',
              '&nbsp;<span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; vertical-align: middle;">Alta</span>&nbsp;',
            )
          }
          title="Prioridade Alta"
        >
          <div className="h-3 w-3 rounded-full bg-red-500" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-yellow-600"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            execCommand(
              'insertHTML',
              '&nbsp;<span style="background-color: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; vertical-align: middle;">Média</span>&nbsp;',
            )
          }
          title="Prioridade Média"
        >
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            execCommand(
              'insertHTML',
              '&nbsp;<span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; vertical-align: middle;">Baixa</span>&nbsp;',
            )
          }
          title="Prioridade Baixa"
        >
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => execCommand('insertHTML', '<div>[ ] </div>')}
          title="Caixa de Seleção (Ação)"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleImageClick}
          title="Inserir Imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        className="p-4 flex-1 overflow-y-auto outline-none max-w-none focus:ring-2 ring-ring/50 prose prose-sm sm:prose-base dark:prose-invert w-full"
        contentEditable={!disabled}
        suppressContentEditableWarning={true}
        onInput={(e) => {
          saveSelection()
          onChange(e.currentTarget.innerHTML)
        }}
        onFocus={() => {
          if (onFocus) onFocus()
        }}
        onBlur={(e) => {
          saveSelection()
          onChange(e.currentTarget.innerHTML)
          if (onBlur) onBlur()
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        dangerouslySetInnerHTML={{ __html: initialValueRef.current }}
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}
