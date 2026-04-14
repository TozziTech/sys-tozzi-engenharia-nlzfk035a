import { ScrollArea } from '@/components/ui/scroll-area'

export function ContractPreview({ content }: { content: string }) {
  return (
    <ScrollArea className="flex-1 p-6 h-full bg-muted/20">
      <div className="bg-white text-black shadow-sm mx-auto max-w-[210mm] min-h-[297mm] p-10 sm:p-16 ring-1 ring-black/5">
        <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed font-normal">
          {content}
        </pre>
      </div>
    </ScrollArea>
  )
}
