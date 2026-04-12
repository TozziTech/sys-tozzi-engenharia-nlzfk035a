import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getContrastYIQ } from '@/lib/colors'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export function ManageTagsDialog({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const { toast } = useToast()

  const loadTags = async () => {
    try {
      const data = await pb.collection('tags').getFullList({ sort: 'name' })
      setTags(data)
    } catch (error) {
      console.error('Error loading tags', error)
    }
  }

  useEffect(() => {
    if (open) loadTags()
  }, [open])

  useRealtime('tags', loadTags, open)

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await pb.collection('tags').create({ name: newName, color: newColor })
      setNewName('')
      setNewColor('#3b82f6')
      loadTags()
      toast({ title: 'Tag criada com sucesso' })
    } catch (e: any) {
      toast({
        title: 'Erro ao criar tag',
        description: e.message || 'Verifique se o nome não está duplicado.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('tags').delete(id)
      loadTags()
      toast({ title: 'Tag removida' })
    } catch (e) {
      toast({ title: 'Erro ao remover tag', variant: 'destructive' })
    }
  }

  const startEdit = (tag: any) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleUpdate = async () => {
    if (!editName.trim() || !editingId) return
    try {
      await pb.collection('tags').update(editingId, { name: editName, color: editColor })
      setEditingId(null)
      loadTags()
      toast({ title: 'Tag atualizada com sucesso' })
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar tag',
        description: e.message || 'Verifique se o nome não está duplicado.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) cancelEdit()
        setOpen(val)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da tag (ex: Urgente)"
              className="flex-1"
            />
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-14 h-10 p-1 cursor-pointer"
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tag cadastrada.
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors gap-2"
                >
                  {editingId === tag.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                      />
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-8 p-1 cursor-pointer shrink-0"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUpdate}
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelEdit}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Badge
                        style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }}
                        className="border-none font-medium px-2 py-1"
                      >
                        {tag.name}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(tag)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tag.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
