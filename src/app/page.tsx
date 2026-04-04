'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
  ChevronLeft,
  CheckCircle,
  XCircle,
  MessageCircle,
  Utensils,
  CircleDollarSign,
  Download,
  Upload
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Team {
  id: string
  name: string
  contactName: string
  phoneNumber: string
  participantCount: number
  mealDays: number
  mealPaid: boolean
  hasTelegram: boolean
  hasMaxMessenger: boolean
  hasPhoneContact: boolean
  notes: string
  createdAt: string
  updatedAt: string
  competitionId: string
}

interface Competition {
  id: string
  name: string
  startDate: string
  endDate: string
  mealCost: number
  notes: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  teams: Team[]
}

// Format number with spaces as thousand separator
function formatMoney(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ₽'
}

export default function CompetitionTracker() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    startDate: new Date(),
    endDate: new Date(),
    mealCost: 0,
    notes: ''
  })

  // Форма команды
  const [teamForm, setTeamForm] = useState({
    name: '',
    contactName: '',
    phoneNumber: '',
    participantCount: 1,
    mealDays: 1,
    mealPaid: false,
    hasTelegram: false,
    hasMaxMessenger: false,
    hasPhoneContact: false,
    notes: ''
  })
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const selectedCompetitionRef = useRef<Competition | null>(null)

  // Загрузка соревнований
  // Синхронизируем ref со state
  useEffect(() => { selectedCompetitionRef.current = selectedCompetition }, [selectedCompetition])

  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/competitions?archived=${showArchived}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setCompetitions(data)
        // Обновляем selectedCompetition свежими данными через ref
        const current = selectedCompetitionRef.current
        if (current) {
          const updated = data.find((c: Competition) => c.id === current.id)
          if (updated) setSelectedCompetition(updated)
        }
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
  // Экспорт данных
  const exportData = async () => {
    try {
      const res = await fetch('/api/data')
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `competition-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Бэкап скачан')
    } catch {
      toast.error('Ошибка при скачивании бэкапа')
    }
  }

  // Импорт данных
  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const result = await res.json()
        toast.success(result.message || 'Данные восстановлены')
        loadCompetitions()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при импорте')
      }
    } catch {
      toast.error('Неверный формат файла')
    }

    // Сбросить input чтобы можно было выбрать тот же файл
    e.target.value = ''
  }

  const resetCompForm = () => {
    setCompForm({
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      mealCost: 0,
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
      mealDays: 1,
      mealPaid: false,
      hasTelegram: false,
      hasMaxMessenger: false,
      hasPhoneContact: false,
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
        if (deleteTarget.type === 'team' && selectedCompetition) {
          // Удаляем команду из выбранного соревнования без перезагрузки страницы
          setSelectedCompetition({
            ...selectedCompetition,
            teams: selectedCompetition.teams.filter(t => t.id !== deleteTarget.id)
          })
          loadCompetitions()
        } else if (deleteTarget.type === 'competition') {
          setSelectedCompetition(null)
          loadCompetitions()
        } else {
          loadCompetitions()
        }
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
      mealDays: team.mealDays,
      mealPaid: team.mealPaid,
      hasTelegram: team.hasTelegram,
      hasMaxMessenger: team.hasMaxMessenger,
      hasPhoneContact: team.hasPhoneContact,
      notes: team.notes
    })
    setShowEditTeam(true)
  }

  // Открыть редактирование соревнования
  const openEditCompetition = (competition: Competition) => {
    setCompForm({
      name: competition.name,
      startDate: new Date(competition.startDate),
      endDate: new Date(competition.endDate),
      mealCost: competition.mealCost,
      notes: competition.notes
    })
    setShowEditCompetition(true)
  }

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: ru })
  }

  const formatPeriod = (start: string, end: string) => {
    const s = format(new Date(start), 'd MMM', { locale: ru })
    const e = format(new Date(end), 'd MMM yyyy', { locale: ru })
    return `${s} — ${e}`
  }

  // Форматирование телефона
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
    }
    return phone
  }

  // Статистика соревнования — с расчётом денег и порций
  const getStats = (competition: Competition) => {
    const totalTeams = competition.teams.length
    const totalParticipants = competition.teams.reduce((sum, t) => sum + t.participantCount, 0)

    const paidTeams = competition.teams.filter(t => t.mealPaid)
    const unpaidTeams = competition.teams.filter(t => !t.mealPaid)

    const paidPortions = paidTeams.reduce((sum, t) => sum + t.participantCount * t.mealDays, 0)
    const unpaidPortions = unpaidTeams.reduce((sum, t) => sum + t.participantCount * t.mealDays, 0)
    const totalPortions = paidPortions + unpaidPortions

    const mealCost = competition.mealCost || 0
    const paidCost = paidPortions * mealCost
    const unpaidCost = unpaidPortions * mealCost
    const totalCost = totalPortions * mealCost

    return { totalTeams, totalParticipants, paidPortions, unpaidPortions, totalPortions, paidCost, unpaidCost, totalCost, mealCost }
  }

  // Форма команды (используется в обоих диалогах — создание и редактирование)
  const renderTeamFormFields = () => (
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
          onChange={e => setTeamForm({ ...teamForm, participantCount: e.target.value === '' ? '' as any : parseInt(e.target.value) || 1 })}
          onBlur={() => setTeamForm({ ...teamForm, participantCount: teamForm.participantCount || 1 })}
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
        <Label>Дней питания</Label>
        <Input
          type="number"
          min={1}
          value={teamForm.mealDays}
          onChange={e => setTeamForm({ ...teamForm, mealDays: e.target.value === '' ? '' as any : parseInt(e.target.value) || 1 })}
          onBlur={() => setTeamForm({ ...teamForm, mealDays: teamForm.mealDays || 1 })}
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

      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 h-10 rounded-md border px-3">
          <Switch
            checked={teamForm.hasTelegram}
            onCheckedChange={checked => setTeamForm({ ...teamForm, hasTelegram: checked })}
          />
          <Label className="text-sm">Telegram</Label>
        </div>
        <div className="flex-1 flex items-center gap-2 h-10 rounded-md border px-3">
          <Switch
            checked={teamForm.hasMaxMessenger}
            onCheckedChange={checked => setTeamForm({ ...teamForm, hasMaxMessenger: checked })}
          />
          <Label className="text-sm">MAX</Label>
        </div>
        <div className="flex-1 flex items-center gap-2 h-10 rounded-md border px-3">
          <Switch
            checked={teamForm.hasPhoneContact}
            onCheckedChange={checked => setTeamForm({ ...teamForm, hasPhoneContact: checked })}
          />
          <Label className="text-sm">По телефону</Label>
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
  )

  // Форма соревнования (используется в обоих диалогах)
  const renderCompFormFields = (onSubmit: () => void, submitLabel: string) => (
    <>
      <DialogHeader>
        <DialogTitle>{submitLabel === 'Создать' ? 'Новое соревнование' : 'Редактировать соревнование'}</DialogTitle>
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
          <Label>Период проведения</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {format(compForm.startDate, 'd MMM yyyy', { locale: ru })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={compForm.startDate}
                  onSelect={date => date && setCompForm({ ...compForm, startDate: date })}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {format(compForm.endDate, 'd MMM yyyy', { locale: ru })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={compForm.endDate}
                  onSelect={date => date && setCompForm({ ...compForm, endDate: date })}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Стоимость 1 питания</Label>
          <Input
            type="number"
            min={0}
            value={compForm.mealCost || ''}
            onChange={e => setCompForm({ ...compForm, mealCost: parseInt(e.target.value) || 0 })}
            placeholder="0"
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
        <Button variant="outline" onClick={() => { setShowAddCompetition(false); setShowEditCompetition(false); resetCompForm(); }}>
          Отмена
        </Button>
        <Button type="button" onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </>
  )

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
                <p className="text-sm text-gray-500">{formatPeriod(selectedCompetition.startDate, selectedCompetition.endDate)}</p>
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
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-sm bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
              <span className="font-semibold">{stats.totalTeams}</span>
              <span className="text-gray-500">команд</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-semibold">{stats.totalParticipants}</span>
              <span className="text-gray-500">участ.</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-green-50 rounded-lg px-2.5 py-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="font-semibold text-green-600">{formatMoney(stats.paidCost)}</span>
              <span className="text-gray-500">оплач.</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-orange-50 rounded-lg px-2.5 py-1.5">
              <XCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="font-semibold text-orange-600">{formatMoney(stats.unpaidCost)}</span>
              <span className="text-gray-500">не оплач.</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-blue-50 rounded-lg px-2.5 py-1.5">
              <Utensils className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-semibold text-blue-600">{formatMoney(stats.totalCost)}</span>
              <span className="text-gray-500">итого ({stats.totalPortions} порц.)</span>
            </div>
            {stats.mealCost > 0 && (
              <div className="flex items-center gap-1.5 text-sm bg-gray-50 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-gray-400">₽</span>
                <span className="font-semibold">{formatMoney(stats.mealCost)}</span>
                <span className="text-gray-500">/ пит.</span>
              </div>
            )}
          </div>

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
                  <p className="text-sm">Нажмите &quot;Добавить&quot; чтобы добавить команду</p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {selectedCompetition.teams.map(team => (
                  <Card key={team.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{team.name}</h3>
                            {team.mealPaid ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                            )}
                            {team.hasPhoneContact && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                По телефону
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{team.participantCount} чел. · {team.mealDays} дн. пит.</span>
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

                      <div className="flex gap-2 flex-wrap">
                        {team.hasTelegram && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <MessageCircle className="h-3 w-3 mr-1" />
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Диалог добавления команды */}
        <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Новая команда</DialogTitle>
            </DialogHeader>
            {renderTeamFormFields()}
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
            {renderTeamFormFields()}
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
            {renderCompFormFields(updateCompetition, 'Сохранить')}
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
                variant="ghost"
                size="sm"
                onClick={exportData}
                title="Скачать бэкап"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Восстановить из бэкапа"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={importData}
              />
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
                  : 'Нажмите «Добавить» чтобы создать соревнование'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {competitions.map(competition => {
              const stats = getStats(competition)
              return (
                <Card
                  key={competition.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCompetition(competition)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold">{competition.name}</h3>
                        <p className="text-sm text-gray-500">{formatPeriod(competition.startDate, competition.endDate)}</p>
                      </div>
                      {competition.isArchived && (
                        <Badge variant="secondary">Архив</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {competition.teams.length} команд
                      </Badge>
                      <Badge variant="outline">
                        {stats.totalParticipants} участников
                      </Badge>
                      {competition.mealCost > 0 && (
                        <Badge variant="outline" className="bg-gray-50">
                          <CircleDollarSign className="h-3 w-3 mr-1" />
                          {competition.mealCost} ₽/пит.
                        </Badge>
                      )}
                      {stats.paidCost > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {formatMoney(stats.paidCost)}
                        </Badge>
                      )}
                      {stats.unpaidCost > 0 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {formatMoney(stats.unpaidCost)}
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
          {renderCompFormFields(createCompetition, 'Создать')}
        </DialogContent>
      </Dialog>
    </div>
  )
}
