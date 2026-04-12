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
import { Trash2, Plus } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getContrastYIQ } from '@/lib/colors'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export function ManageTagsDialog({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Badge
                    style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }}
                    className="border-none font-medium px-2 py-1"
                  >
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tag.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
