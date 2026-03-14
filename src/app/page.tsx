'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit, 
  Archive, 
  ArchiveRestore,
  Users, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin, 
  ChevronLeft,
  CheckCircle,
  XCircle,
  Send,
  MessageCircle,
  Utensils
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Team {
  id: string
  name: string
  contactName: string
  phoneNumber: string
  participantCount: number
  mealPaid: boolean
  hasTelegram: boolean
  hasMaxMessenger: boolean
  notes: string
  createdAt: string
  competitionId: string
}

interface Competition {
  id: string
  name: string
  date: string
  location: string
  notes: string
  isArchived: boolean
  createdAt: string
  teams: Team[]
}

export default function CompetitionTracker() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Диалоги
  const [showAddCompetition, setShowAddCompetition] = useState(false)
  const [showEditCompetition, setShowEditCompetition] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'competition' | 'team', id: string } | null>(null)
  
  // Форма соревнования
  const [compForm, setCompForm] = useState({
    name: '',
    date: new Date(),
    location: '',
    notes: ''
  })
  
  // Форма команды
  const [teamForm, setTeamForm] = useState({
    name: '',
    contactName: '',
    phoneNumber: '',
    participantCount: 1,
    mealPaid: false,
    hasTelegram: false,
    hasMaxMessenger: false,
    notes: ''
  })
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  // Загрузка соревнований
  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/competitions?archived=${showArchived}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setCompetitions(data)
      } else {
        console.error('API returned non-array:', data)
        setCompetitions([])
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch (e) {
      console.error('Load error:', e)
      toast.error('Ошибка при загрузке соревнований')
      setCompetitions([])
    } finally {
      setLoading(false)
    }
  }, [showArchived])

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  // Сброс формы соревнования
  const resetCompForm = () => {
    setCompForm({
      name: '',
      date: new Date(),
      location: '',
      notes: ''
    })
  }

  // Сброс формы команды
  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      contactName: '',
      phoneNumber: '',
      participantCount: 1,
      mealPaid: false,
      hasTelegram: false,
      hasMaxMessenger: false,
      notes: ''
    })
    setEditingTeam(null)
  }

  // Создание соревнования
  const createCompetition = async () => {
    if (!compForm.name) {
      toast.error('Введите название соревнования')
      return
    }
    
    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm)
      })
      
      if (res.ok) {
        toast.success('Соревнование создано')
        setShowAddCompetition(false)
        resetCompForm()
        loadCompetitions()
      } else {
        toast.error('Ошибка при создании')
      }
    } catch {
      toast.error('Ошибка при создании')
    }
  }

  // Обновление соревнования
  const updateCompetition = async () => {
    if (!selectedCompetition || !compForm.name) return
    
    try {
      const res = await fetch(`/api/competitions/${selectedCompetition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm)
      })
      
      if (res.ok) {
        toast.success('Соревнование обновлено')
        setShowEditCompetition(false)
        resetCompForm()
        loadCompetitions()
      }
    } catch {
      toast.error('Ошибка при обновлении')
    }
  }

  // Архивирование/восстановление
  const toggleArchive = async (competition: Competition) => {
    try {
      const res = await fetch(`/api/competitions/${competition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !competition.isArchived })
      })
      
      if (res.ok) {
        toast.success(competition.isArchived ? 'Восстановлено из архива' : 'Перемещено в архив')
        loadCompetitions()
        if (selectedCompetition?.id === competition.id) {
          setSelectedCompetition(null)
        }
      }
    } catch {
      toast.error('Ошибка')
    }
  }

  // Удаление
  const handleDelete = async () => {
    if (!deleteTarget) return
    
    try {
      const endpoint = deleteTarget.type === 'competition' 
        ? `/api/competitions/${deleteTarget.id}`
        : `/api/teams/${deleteTarget.id}`
      
      const res = await fetch(endpoint, { method: 'DELETE' })
      
      if (res.ok) {
        toast.success('Удалено')
        if (deleteTarget.type === 'competition') {
          setSelectedCompetition(null)
        }
        loadCompetitions()
      }
    } catch {
      toast.error('Ошибка при удалении')
    } finally {
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  // Создание команды
  const createTeam = async () => {
    if (!teamForm.name || !selectedCompetition) {
      toast.error('Введите название команды')
      return
    }
    
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamForm, competitionId: selectedCompetition.id })
      })
      
      if (res.ok) {
        toast.success('Команда добавлена')
        setShowAddTeam(false)
        resetTeamForm()
        loadCompetitions()
      }
    } catch {
      toast.error('Ошибка при добавлении')
    }
  }

  // Обновление команды
  const updateTeam = async () => {
    if (!editingTeam || !teamForm.name) return
    
    try {
      const res = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      })
      
      if (res.ok) {
        toast.success('Команда обновлена')
        setShowEditTeam(false)
        resetTeamForm()
        loadCompetitions()
      }
    } catch {
      toast.error('Ошибка при обновлении')
    }
  }

  // Открыть редактирование команды
  const openEditTeam = (team: Team) => {
    setEditingTeam(team)
    setTeamForm({
      name: team.name,
      contactName: team.contactName,
      phoneNumber: team.phoneNumber,
      participantCount: team.participantCount,
      mealPaid: team.mealPaid,
      hasTelegram: team.hasTelegram,
      hasMaxMessenger: team.hasMaxMessenger,
      notes: team.notes
    })
    setShowEditTeam(true)
  }

  // Открыть редактирование соревнования
  const openEditCompetition = (competition: Competition) => {
    setCompForm({
      name: competition.name,
      date: new Date(competition.date),
      location: competition.location,
      notes: competition.notes
    })
    setShowEditCompetition(true)
  }

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: ru })
  }

  // Форматирование телефона
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
    }
    return phone
  }

  // Статистика соревнования
  const getStats = (competition: Competition) => {
    const totalParticipants = competition.teams.reduce((sum, t) => sum + t.participantCount, 0)
    const paidMeals = competition.teams.filter(t => t.mealPaid).reduce((sum, t) => sum + t.participantCount, 0)
    const unpaidMeals = totalParticipants - paidMeals
    return { totalParticipants, paidMeals, unpaidMeals }
  }

  // Если выбрано соревнование - показываем детали
  if (selectedCompetition) {
    const stats = getStats(selectedCompetition)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompetition(null)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg truncate">{selectedCompetition.name}</h1>
                <p className="text-sm text-gray-500">{formatDate(selectedCompetition.date)}</p>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => openEditCompetition(selectedCompetition)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleArchive(selectedCompetition)}
                >
                  {selectedCompetition.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    setDeleteTarget({ type: 'competition', id: selectedCompetition.id })
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedCompetition.teams.length}</p>
                    <p className="text-sm text-gray-500">Команд</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                    <p className="text-sm text-gray-500">Участников</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Utensils className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.paidMeals}</p>
                    <p className="text-sm text-gray-500">Питание оплачено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Utensils className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.unpaidMeals}</p>
                    <p className="text-sm text-gray-500">Не оплачено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Место проведения */}
          {selectedCompetition.location && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedCompetition.location}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Команды */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Команды</h2>
              <Button size="sm" onClick={() => setShowAddTeam(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>

            {selectedCompetition.teams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Нет команд</p>
                  <p className="text-sm">Нажмите "Добавить" чтобы добавить команду</p>
                </CardContent>
              </Card>
            ) : (
              selectedCompetition.teams.map(team => (
                <Card key={team.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{team.name}</h3>
                          {team.mealPaid ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{team.participantCount} чел.</span>
                          {team.contactName && (
                            <span className="truncate">{team.contactName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditTeam(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500"
                          onClick={() => {
                            setDeleteTarget({ type: 'team', id: team.id })
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {team.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${team.phoneNumber}`} className="hover:underline">
                          {formatPhone(team.phoneNumber)}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {team.hasTelegram && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          <Send className="h-3 w-3 mr-1" />
                          Telegram
                        </Badge>
                      )}
                      {team.hasMaxMessenger && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          MAX
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Диалог добавления команды */}
        <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Новая команда</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Название команды *</Label>
                <Input 
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Название команды"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Количество участников</Label>
                <Input 
                  type="number"
                  min={1}
                  value={teamForm.participantCount}
                  onChange={e => setTeamForm({ ...teamForm, participantCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Питание оплачено</Label>
                <Switch 
                  checked={teamForm.mealPaid}
                  onCheckedChange={checked => setTeamForm({ ...teamForm, mealPaid: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Имя контакта</Label>
                <Input 
                  value={teamForm.contactName}
                  onChange={e => setTeamForm({ ...teamForm, contactName: e.target.value })}
                  placeholder="Имя контактного лица"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input 
                  value={teamForm.phoneNumber}
                  onChange={e => setTeamForm({ ...teamForm, phoneNumber: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  type="tel"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Telegram</Label>
                  <Switch 
                    checked={teamForm.hasTelegram}
                    onCheckedChange={checked => setTeamForm({ ...teamForm, hasTelegram: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">MAX</Label>
                  <Switch 
                    checked={teamForm.hasMaxMessenger}
                    onCheckedChange={checked => setTeamForm({ ...teamForm, hasMaxMessenger: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea 
                  value={teamForm.notes}
                  onChange={e => setTeamForm({ ...teamForm, notes: e.target.value })}
                  placeholder="Дополнительная информация"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddTeam(false); resetTeamForm(); }}>
                Отмена
              </Button>
              <Button onClick={createTeam}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Диалог редактирования команды */}
        <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать команду</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Название команды *</Label>
                <Input 
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Название команды"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Количество участников</Label>
                <Input 
                  type="number"
                  min={1}
                  value={teamForm.participantCount}
                  onChange={e => setTeamForm({ ...teamForm, participantCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Питание оплачено</Label>
                <Switch 
                  checked={teamForm.mealPaid}
                  onCheckedChange={checked => setTeamForm({ ...teamForm, mealPaid: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Имя контакта</Label>
                <Input 
                  value={teamForm.contactName}
                  onChange={e => setTeamForm({ ...teamForm, contactName: e.target.value })}
                  placeholder="Имя контактного лица"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input 
                  value={teamForm.phoneNumber}
                  onChange={e => setTeamForm({ ...teamForm, phoneNumber: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  type="tel"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Telegram</Label>
                  <Switch 
                    checked={teamForm.hasTelegram}
                    onCheckedChange={checked => setTeamForm({ ...teamForm, hasTelegram: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">MAX</Label>
                  <Switch 
                    checked={teamForm.hasMaxMessenger}
                    onCheckedChange={checked => setTeamForm({ ...teamForm, hasMaxMessenger: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea 
                  value={teamForm.notes}
                  onChange={e => setTeamForm({ ...teamForm, notes: e.target.value })}
                  placeholder="Дополнительная информация"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditTeam(false); resetTeamForm(); }}>
                Отмена
              </Button>
              <Button onClick={updateTeam}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Диалог редактирования соревнования */}
        <Dialog open={showEditCompetition} onOpenChange={setShowEditCompetition}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать соревнование</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input 
                  value={compForm.name}
                  onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                  placeholder="Название соревнования"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Дата проведения</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(compForm.date, 'd MMMM yyyy', { locale: ru })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={compForm.date}
                      onSelect={date => date && setCompForm({ ...compForm, date })}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Место проведения</Label>
                <Input 
                  value={compForm.location}
                  onChange={e => setCompForm({ ...compForm, location: e.target.value })}
                  placeholder="Город, адрес"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea 
                  value={compForm.notes}
                  onChange={e => setCompForm({ ...compForm, notes: e.target.value })}
                  placeholder="Дополнительная информация"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditCompetition(false); resetCompForm(); }}>
                Отмена
              </Button>
              <Button onClick={updateCompetition}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. {deleteTarget?.type === 'competition' 
                  ? 'Все команды в этом соревновании будут также удалены.' 
                  : 'Команда будет удалена.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Список соревнований
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h1 className="text-xl font-bold">
                {showArchived ? 'Архив' : 'Соревнования'}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'Активные' : 'Архив'}
              </Button>
              {!showArchived && (
                <Button size="sm" onClick={() => setShowAddCompetition(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Загрузка...
          </div>
        ) : competitions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-gray-500">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                {showArchived ? 'Архив пуст' : 'Нет соревнований'}
              </p>
              <p className="text-sm">
                {showArchived 
                  ? 'Нет архивированных соревнований' 
                  : 'Нажмите "Добавить" чтобы создать соревнование'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {competitions.map(competition => {
              const stats = getStats(competition)
              return (
                <Card 
                  key={competition.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCompetition(competition)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{competition.name}</h3>
                        <p className="text-sm text-gray-500">{formatDate(competition.date)}</p>
                      </div>
                      {competition.isArchived && (
                        <Badge variant="secondary">Архив</Badge>
                      )}
                    </div>
                    
                    {competition.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{competition.location}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {competition.teams.length} команд
                      </Badge>
                      <Badge variant="outline">
                        {stats.totalParticipants} участников
                      </Badge>
                      {stats.paidMeals > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Utensils className="h-3 w-3 mr-1" />
                          {stats.paidMeals} пит.
                        </Badge>
                      )}
                      {stats.unpaidMeals > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {stats.unpaidMeals} не оплачено
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Диалог добавления соревнования */}
      <Dialog open={showAddCompetition} onOpenChange={setShowAddCompetition}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новое соревнование</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input 
                value={compForm.name}
                onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                placeholder="Название соревнования"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Дата проведения</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(compForm.date, 'd MMMM yyyy', { locale: ru })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={compForm.date}
                    onSelect={date => date && setCompForm({ ...compForm, date })}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Место проведения</Label>
              <Input 
                value={compForm.location}
                onChange={e => setCompForm({ ...compForm, location: e.target.value })}
                placeholder="Город, адрес"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea 
                value={compForm.notes}
                onChange={e => setCompForm({ ...compForm, notes: e.target.value })}
                placeholder="Дополнительная информация"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddCompetition(false); resetCompForm(); }}>
              Отмена
            </Button>
            <Button onClick={createCompetition}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}