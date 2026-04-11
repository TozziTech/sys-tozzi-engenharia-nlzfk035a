import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import useProjectStore from '@/stores/useProjectStore'
import { MemberCard } from '@/components/team/MemberCard'
import { MemberForm } from '@/components/team/MemberForm'
import { User } from '@/types/project'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Users } from 'lucide-react'

export default function Team() {
  const { users, updateUserRole } = useProjectStore()
  const [localUsers, setLocalUsers] = useState<User[]>([])
  const [editedUsers, setEditedUsers] = useState<Record<string, User>>({})
  const [deletedUsers, setDeletedUsers] = useState<Set<string>>(new Set())
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const allMembers = useMemo(() => {
    const storeMembers = users.map((u) => editedUsers[u.id] || u)
    return [...storeMembers, ...localUsers]
  }, [users, localUsers, editedUsers])

  const specialties = useMemo(() => {
    const specs = new Set(allMembers.map((m) => m.specialty).filter(Boolean))
    return Array.from(specs) as string[]
  }, [allMembers])

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      if (deletedUsers.has(m.id)) return false
      const matchesSpec = specialtyFilter === 'all' || m.specialty === specialtyFilter
      const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSpec && matchesSearch
    })
  }, [allMembers, specialtyFilter, searchQuery, deletedUsers])

  const handleAddMember = (user: User) => {
    setLocalUsers((prev) => [...prev, user])
  }

  const handleUpdateMember = (user: User) => {
    if (localUsers.find((u) => u.id === user.id)) {
      setLocalUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)))
    } else {
      setEditedUsers((prev) => ({ ...prev, [user.id]: user }))
      if (updateUserRole && user.role) {
        updateUserRole(user.id, user.role)
      }
    }
  }

  const handleDeleteMember = (id: string) => {
    setDeletedUsers((prev) => {
      const newSet = new Set(prev)
      newSet.add(id)
      return newSet
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe, especialidades, acessos e dados financeiros.
          </p>
        </div>
        <MemberForm onAdd={handleAddMember} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[260px]">
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filtrar por Especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Especialidades</SelectItem>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:ml-auto text-sm font-medium text-muted-foreground">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'} encontrado
          {filteredMembers.length !== 1 && 's'}
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              user={member}
              onUpdate={handleUpdateMember}
              onDelete={handleDeleteMember}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed bg-muted/10">
          <div className="bg-background p-4 rounded-full mb-4 shadow-sm border border-border/50">
            <Users className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <p className="text-lg font-semibold text-foreground">Nenhum membro encontrado</p>
          <p className="text-sm mt-1">
            Ajuste os filtros de busca ou adicione um novo membro à equipe.
          </p>
        </Card>
      )}
    </div>
  )
}
