import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, BookText, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getContractClauses,
  deleteContractClause,
  ContractClause,
} from '@/services/contract_clauses'
import { ClauseEditorDialog } from './ClauseEditorDialog'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/use-permissions'

export function ClauseLibrary() {
  const { canWrite } = usePermissions()
  const canEdit = canWrite('contratos')
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
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
    const searchLower = search.toLowerCase()
    const matchesSearch =
      c.name.toLowerCase().includes(searchLower) ||
      c.content.toLowerCase().includes(searchLower) ||
      (c.expand?.tags?.some((t) => t.name.toLowerCase().includes(searchLower)) ?? false)

    const matchesCategory = categoryFilter ? c.category === categoryFilter : true
    const matchesTag = tagFilter ? (c.tags?.includes(tagFilter) ?? false) : true
    return matchesSearch && matchesCategory && matchesTag
  })

  const categories = Array.from(new Set(clauses.map((c) => c.category).filter(Boolean)))

  const allTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; color: string }>()
    clauses.forEach((c) => {
      c.expand?.tags?.forEach((t) => {
        if (!tagMap.has(t.id)) tagMap.set(t.id, t)
      })
    })
    return Array.from(tagMap.values())
  }, [clauses])

  const handleInsert = (e: React.MouseEvent, content: string) => {
    if (!canEdit) return
    e.preventDefault()
    document.dispatchEvent(new CustomEvent('insert-editor-html', { detail: content }))
  }

  const handleDelete = async (id: string) => {
    if (!canEdit) return
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
                placeholder="Buscar cláusulas, tags..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingClause(undefined)
                  setIsEditorOpen(true)
                }}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(categories.length > 0 || allTags.length > 0) && (
            <div className="flex flex-col gap-2">
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <Button
                    variant={categoryFilter === '' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full px-3 h-7 text-xs"
                    onClick={() => setCategoryFilter('')}
                  >
                    Categorias
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
              {allTags.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin items-center">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                  <Button
                    variant={tagFilter === '' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full px-3 h-6 text-xs"
                    onClick={() => setTagFilter('')}
                  >
                    Todas
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={tagFilter === tag.id ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full px-3 h-6 text-xs whitespace-nowrap transition-colors"
                      onClick={() => setTagFilter(tag.id)}
                      style={{
                        borderColor: tagFilter !== tag.id ? tag.color : undefined,
                        backgroundColor: tagFilter === tag.id ? tag.color : undefined,
                        color: tagFilter === tag.id ? '#fff' : tag.color,
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              )}
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
                    {canEdit && (
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
                    )}
                  </div>

                  {clause.expand?.tags && clause.expand.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {clause.expand.tags.map((t) => (
                        <Badge
                          key={t.id}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-medium"
                          style={{ borderColor: t.color, color: t.color }}
                        >
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div
                    className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded border mt-1"
                    dangerouslySetInnerHTML={{ __html: clause.content }}
                  />
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-2"
                      onMouseDown={(e) => handleInsert(e, clause.content)}
                    >
                      Inserir no Contrato
                    </Button>
                  )}
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
