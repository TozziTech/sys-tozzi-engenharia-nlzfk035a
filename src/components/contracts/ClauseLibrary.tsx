import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, BookText, Plus, Pencil, Trash2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getContractClauses,
  deleteContractClause,
  ContractClause,
} from '@/services/contract_clauses'
import { ClauseEditorDialog } from './ClauseEditorDialog'
import { toast } from 'sonner'

export function ClauseLibrary() {
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingClause, setEditingClause] = useState<ContractClause | undefined>()
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const loadClauses = async () => {
    try {
      const data = await getContractClauses()
      setClauses(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadClauses()
  }, [])
  useRealtime('contract_clauses', () => loadClauses())

  const filteredClauses = clauses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter ? c.category === categoryFilter : true
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(clauses.map((c) => c.category).filter(Boolean)))

  const handleInsert = (e: React.MouseEvent, content: string) => {
    e.preventDefault()
    document.dispatchEvent(new CustomEvent('insert-editor-html', { detail: content }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cláusula?')) return
    try {
      await deleteContractClause(id)
      toast.success('Cláusula excluída')
    } catch (error) {
      toast.error('Erro ao excluir cláusula')
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookText className="w-4 h-4" />
          Biblioteca de Cláusulas
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Biblioteca de Cláusulas</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-6 pt-2 flex-1 overflow-hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cláusulas..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setEditingClause(undefined)
                setIsEditorOpen(true)
              }}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <Button
                variant={categoryFilter === '' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full px-3 h-7 text-xs"
                onClick={() => setCategoryFilter('')}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full px-3 h-7 text-xs whitespace-nowrap"
                  onClick={() => setCategoryFilter(cat as string)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="flex flex-col gap-3 pb-6">
              {filteredClauses.map((clause) => (
                <div key={clause.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-card">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-medium text-sm">{clause.name}</h4>
                      {clause.category && (
                        <span className="text-xs text-muted-foreground">{clause.category}</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingClause(clause)
                          setIsEditorOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(clause.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded border"
                    dangerouslySetInnerHTML={{ __html: clause.content }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full mt-2"
                    onMouseDown={(e) => handleInsert(e, clause.content)}
                  >
                    Inserir no Contrato
                  </Button>
                </div>
              ))}
              {filteredClauses.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma cláusula encontrada.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        {isEditorOpen && (
          <ClauseEditorDialog
            clause={editingClause}
            open={isEditorOpen}
            onOpenChange={setIsEditorOpen}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
