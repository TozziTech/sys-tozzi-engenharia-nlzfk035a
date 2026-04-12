import React, { Fragment } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const parseInline = (text: string) => {
    // Split by markdown links
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
    return parts.map((part, i) => {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 font-medium transition-colors"
          >
            {parseBoldItalic(linkMatch[1])}
          </a>
        )
      }
      return <Fragment key={i}>{parseBoldItalic(part)}</Fragment>
    })
  }

  const parseBoldItalic = (text: string) => {
    // Split by bold (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-foreground">
            {parseItalic(part.slice(2, -2))}
          </strong>
        )
      }
      return <Fragment key={i}>{parseItalic(part)}</Fragment>
    })
  }

  const parseItalic = (text: string) => {
    // Split by italic (*text* or _text_)
    const parts = text.split(/(\*[^*]+\*|_[^_]+_)/g)
    return parts.map((part, i) => {
      if (
        (part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))
      ) {
        return (
          <em key={i} className="italic text-foreground/90">
            {part.slice(1, -1)}
          </em>
        )
      }
      return <Fragment key={i}>{part}</Fragment>
    })
  }

  const renderBlocks = (text: string) => {
    const lines = text.split(/\r?\n/)
    const blocks: React.ReactNode[] = []

    let inList = false
    let listType: 'ul' | 'ol' | null = null
    let listItems: React.ReactNode[] = []
    let listIndex = 0

    const closeList = () => {
      if (inList && listType) {
        if (listType === 'ul') {
          blocks.push(
            <ul
              key={`ul-${listIndex}`}
              className="list-disc pl-6 mb-4 space-y-1.5 text-foreground/90 marker:text-foreground/50"
            >
              {listItems}
            </ul>,
          )
        } else {
          blocks.push(
            <ol
              key={`ol-${listIndex}`}
              className="list-decimal pl-6 mb-4 space-y-1.5 text-foreground/90 marker:text-foreground/70 marker:font-medium"
            >
              {listItems}
            </ol>,
          )
        }
        inList = false
        listType = null
        listItems = []
        listIndex++
      }
    }

    lines.forEach((line, index) => {
      const ulMatch = line.match(/^(\s*)([-*])\s+(.+)$/)
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/)

      if (ulMatch || olMatch) {
        const currentListType = ulMatch ? 'ul' : 'ol'
        const itemContent = ulMatch ? ulMatch[3] : olMatch![3]

        if (!inList) {
          inList = true
          listType = currentListType
        } else if (listType !== currentListType) {
          closeList()
          inList = true
          listType = currentListType
        }

        listItems.push(<li key={`li-${index}`}>{parseInline(itemContent)}</li>)
      } else {
        closeList()
        if (line.trim() === '') {
          if (
            blocks.length > 0 &&
            (blocks[blocks.length - 1] as React.ReactElement)?.type !== 'div'
          ) {
            blocks.push(<div key={`br-${index}`} className="h-4" />)
          }
        } else {
          const h3Match = line.match(/^###\s+(.+)$/)
          const h2Match = line.match(/^##\s+(.+)$/)
          const h1Match = line.match(/^#\s+(.+)$/)

          if (h3Match) {
            blocks.push(
              <h3 key={`h3-${index}`} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                {parseInline(h3Match[1])}
              </h3>,
            )
          } else if (h2Match) {
            blocks.push(
              <h2 key={`h2-${index}`} className="text-xl font-bold mt-5 mb-3 text-foreground">
                {parseInline(h2Match[1])}
              </h2>,
            )
          } else if (h1Match) {
            blocks.push(
              <h1
                key={`h1-${index}`}
                className="text-2xl font-extrabold mt-6 mb-4 text-foreground tracking-tight"
              >
                {parseInline(h1Match[1])}
              </h1>,
            )
          } else {
            blocks.push(
              <p key={`p-${index}`} className="mb-2 last:mb-0 text-foreground/90 leading-relaxed">
                {parseInline(line)}
              </p>,
            )
          }
        }
      }
    })

    closeList()

    return blocks
  }

  return <div className={`text-sm ${className || ''}`}>{renderBlocks(content)}</div>
}
