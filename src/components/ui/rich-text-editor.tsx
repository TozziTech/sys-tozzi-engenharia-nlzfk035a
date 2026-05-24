import * as React from 'react'
import { Bold, Underline, Strikethrough, List, ListOrdered, RemoveFormatting } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 'min-h-[200px]',
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const handleInput = React.useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  return (
    <div
      className={cn(
        'flex flex-col border rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring transition-shadow',
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-muted/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
        <ToggleGroup type="multiple" size="sm">
          <ToggleGroupItem value="bold" aria-label="Bold" onClick={() => executeCommand('bold')}>
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Underline"
            onClick={() => executeCommand('underline')}
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="strikethrough"
            aria-label="Strikethrough"
            onClick={() => executeCommand('strikeThrough')}
          >
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="w-px h-6 bg-border mx-1" />
        <ToggleGroup type="multiple" size="sm">
          <ToggleGroupItem
            value="ul"
            aria-label="Bulleted List"
            onClick={() => executeCommand('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ol"
            aria-label="Numbered List"
            onClick={() => executeCommand('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="w-px h-6 bg-border mx-1" />
        <ToggleGroup type="single" size="sm">
          <ToggleGroupItem
            value="clear"
            aria-label="Clear Formatting"
            onClick={() => executeCommand('removeFormat')}
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        ref={editorRef}
        className={cn(
          'p-4 outline-none prose prose-sm max-w-none dark:prose-invert break-words',
          minHeight,
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:cursor-text empty:before:block',
        )}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        style={{
          height: 'auto',
          overflowY: 'visible',
        }}
      />
    </div>
  )
}
