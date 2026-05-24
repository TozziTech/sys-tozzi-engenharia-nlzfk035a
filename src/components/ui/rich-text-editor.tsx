import React, { useRef, useEffect } from 'react'
import { Button } from './button'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange'
> {
  value?: string | number | readonly string[]
  onChange?: (event: any) => void
}

export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, className, name, id, disabled, ...props }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML
        const newHtml = value?.toString() || ''
        if (currentHtml !== newHtml) {
          editorRef.current.innerHTML = newHtml
        }
      }
    }, [value])

    const handleInput = () => {
      if (editorRef.current && onChange) {
        const html = editorRef.current.innerHTML
        const mockEvent = {
          target: { value: html, name, id },
          currentTarget: { value: html, name, id },
          preventDefault: () => {},
          stopPropagation: () => {},
        }
        onChange(mockEvent)
      }
    }

    const execCommand = (command: string, arg?: string) => {
      document.execCommand(command, false, arg)
      if (editorRef.current) {
        editorRef.current.focus()
        handleInput()
      }
    }

    return (
      <div
        className={cn(
          'border rounded-md overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-ring bg-background',
          className,
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('bold')}
            disabled={disabled}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('italic')}
            disabled={disabled}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('underline')}
            disabled={disabled}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('strikeThrough')}
            disabled={disabled}
            title="Tachado"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('insertUnorderedList')}
            disabled={disabled}
            title="Lista"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0"
            onClick={() => execCommand('insertOrderedList')}
            disabled={disabled}
            title="Lista Numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          className="p-3 min-h-[300px] outline-none prose dark:prose-invert prose-sm max-w-none overflow-y-visible [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-bold [&_i]:italic [&_u]:underline [&_strike]:line-through [&_s]:line-through"
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          style={{ cursor: disabled ? 'not-allowed' : 'text' }}
          {...(props as any)}
        />
      </div>
    )
  },
)
RichTextEditor.displayName = 'RichTextEditor'
