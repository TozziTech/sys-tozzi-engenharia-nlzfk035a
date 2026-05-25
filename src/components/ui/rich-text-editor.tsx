import * as React from 'react'
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const executeCommand = (command: string) => {
    document.execCommand(command, false, undefined)
    handleInput()
    editorRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'border rounded-md border-input bg-background overflow-hidden flex flex-col',
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b bg-muted/50 p-1 flex-wrap">
        <Toggle
          size="sm"
          pressed={false}
          onClick={() => executeCommand('bold')}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onClick={() => executeCommand('italic')}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onClick={() => executeCommand('underline')}
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onClick={() => executeCommand('strikeThrough')}
          aria-label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 overflow-y-auto p-3 outline-none cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground min-h-[200px]"
        data-placeholder={placeholder}
      />
    </div>
  )
}
