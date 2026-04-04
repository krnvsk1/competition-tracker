import fs from 'fs'
import path from 'path'

// --- Types ---

export interface Team {
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
  hasWhatsApp: boolean
  notes: string
  createdAt: string
  updatedAt: string
  competitionId: string
}

export interface Competition {
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

// --- Helpers ---

const DATA_DIR = path.join(process.cwd(), 'data')
const COMPETITIONS_FILE = path.join(DATA_DIR, 'competitions.json')
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json')

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function readJSON<T>(filePath: string): T[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function writeJSON<T>(filePath: string, data: T[]): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// --- Competition CRUD ---

export function getCompetitions(archived: boolean): Competition[] {
  const competitions = readJSON<Competition>(COMPETITIONS_FILE)
  const teams = readJSON<Team>(TEAMS_FILE)

  return competitions
    .filter(c => c.isArchived === archived)
    .map(c => ({
      ...c,
      teams: teams.filter(t => t.competitionId === c.id).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

export function getCompetitionById(id: string): Competition | null {
  const competitions = readJSON<Competition>(COMPETITIONS_FILE)
  const competition = competitions.find(c => c.id === id)
  if (!competition) return null

  const teams = readJSON<Team>(TEAMS_FILE)
  return {
    ...competition,
    teams: teams.filter(t => t.competitionId === id).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }
}

export function createCompetition(data: {
  name: string
  startDate: string
  endDate: string
  mealCost: number
  notes: string
}): Competition {
  const competitions = readJSON<Competition>(COMPETITIONS_FILE)
  const now = new Date().toISOString()

  const competition: Competition = {
    id: generateId(),
    name: data.name,
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    mealCost: data.mealCost || 0,
    notes: data.notes || '',
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    teams: []
  }

  competitions.push(competition)
  writeJSON(COMPETITIONS_FILE, competitions)
  return competition
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined) result[key] = obj[key]
  }
  return result
}

export function updateCompetition(
  id: string,
  data: {
    name?: string
    startDate?: string
    endDate?: string
    mealCost?: number
    notes?: string
    isArchived?: boolean
  }
): Competition | null {
  const competitions = readJSON<Competition>(COMPETITIONS_FILE)
  const idx = competitions.findIndex(c => c.id === id)
  if (idx === -1) return null

  const clean = stripUndefined(data)
  const now = new Date().toISOString()
  competitions[idx] = {
    ...competitions[idx],
    ...clean,
    startDate: clean.startDate ? new Date(clean.startDate as string).toISOString() : competitions[idx].startDate,
    endDate: clean.endDate ? new Date(clean.endDate as string).toISOString() : competitions[idx].endDate,
    updatedAt: now
  }

  writeJSON(COMPETITIONS_FILE, competitions)
  return getCompetitionById(id)
}

export function deleteCompetition(id: string): boolean {
  const competitions = readJSON<Competition>(COMPETITIONS_FILE)
  const filtered = competitions.filter(c => c.id !== id)
  if (filtered.length === competitions.length) return false

  writeJSON(COMPETITIONS_FILE, filtered)

  // Also delete associated teams
  const teams = readJSON<Team>(TEAMS_FILE)
  writeJSON(TEAMS_FILE, teams.filter(t => t.competitionId !== id))

  return true
}

// --- Team CRUD ---

export function getTeams(competitionId?: string): Team[] {
  const teams = readJSON<Team>(TEAMS_FILE)
  const result = competitionId
    ? teams.filter(t => t.competitionId === competitionId)
    : teams
  return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function getTeamById(id: string): Team | null {
  const teams = readJSON<Team>(TEAMS_FILE)
  return teams.find(t => t.id === id) || null
}

export function createTeam(data: {
  name: string
  contactName: string
  phoneNumber: string
  participantCount: number
  mealDays: number
  mealPaid: boolean
  hasTelegram: boolean
  hasMaxMessenger: boolean
  hasPhoneContact: boolean
  hasWhatsApp: boolean
  notes: string
  competitionId: string
}): Team {
  const teams = readJSON<Team>(TEAMS_FILE)
  const now = new Date().toISOString()

  const team: Team = {
    id: generateId(),
    name: data.name,
    contactName: data.contactName || '',
    phoneNumber: data.phoneNumber || '',
    participantCount: data.participantCount || 1,
    mealDays: data.mealDays || 1,
    mealPaid: data.mealPaid || false,
    hasTelegram: data.hasTelegram || false,
    hasMaxMessenger: data.hasMaxMessenger || false,
    hasPhoneContact: data.hasPhoneContact || false,
    hasWhatsApp: data.hasWhatsApp || false,
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
    competitionId: data.competitionId
  }

  teams.push(team)
  writeJSON(TEAMS_FILE, teams)
  return team
}

export function updateTeam(
  id: string,
  data: {
    name?: string
    contactName?: string
    phoneNumber?: string
    participantCount?: number
    mealDays?: number
    mealPaid?: boolean
    hasTelegram?: boolean
    hasMaxMessenger?: boolean
    hasPhoneContact?: boolean
    hasWhatsApp?: boolean
    notes?: string
  }
): Team | null {
  const teams = readJSON<Team>(TEAMS_FILE)
  const idx = teams.findIndex(t => t.id === id)
  if (idx === -1) return null

  const now = new Date().toISOString()
  teams[idx] = {
    ...teams[idx],
    ...data,
    updatedAt: now
  }

  writeJSON(TEAMS_FILE, teams)
  return teams[idx]
}

export function deleteTeam(id: string): boolean {
  const teams = readJSON<Team>(TEAMS_FILE)
  const filtered = teams.filter(t => t.id !== id)
  if (filtered.length === teams.length) return false

  writeJSON(TEAMS_FILE, filtered)
  return true
}

// --- Seed initial data ---

const SEED_KEY = 'klondaik_seeded'

export function seedIfEmpty(): void {
  const markerFile = path.join(DATA_DIR, '.seeded')
  if (fs.existsSync(markerFile)) return

  const existing = readJSON<Competition>(COMPETITIONS_FILE)
  if (existing.length > 0) return

  const competitions: Competition[] = [
    { id: 's1', name: 'Весенний паровоз', startDate: '2026-04-09T00:00:00.000Z', endDate: '2026-04-12T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: Усть-Лабинская «ФРС» 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's2', name: 'Турнир г. Воронеж', startDate: '2026-04-16T00:00:00.000Z', endDate: '2026-04-19T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Карповая секция Воронежской ФРС 8(950)755-43-33 Александр', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's3', name: 'ASV cup', startDate: '2026-04-29T00:00:00.000Z', endDate: '2026-05-03T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: 8(996) 247-57-19 Денис', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's4', name: 'Чемпионат г. Сочи', startDate: '2026-05-06T00:00:00.000Z', endDate: '2026-05-10T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Сочинская ФРС 8(999)654-52-32 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's5', name: 'Кубок Карпятников', startDate: '2026-05-13T00:00:00.000Z', endDate: '2026-05-17T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: 8(952) 869-24-81 Корсунов Дмитрий Сергеевич', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's6', name: 'Кубок КЛОНДАЙКА', startDate: '2026-06-04T00:00:00.000Z', endDate: '2026-06-07T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's7', name: 'Кубок главы МО Усть-Лабинский район (юноши)', startDate: '2026-06-11T00:00:00.000Z', endDate: '2026-06-14T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Усть-Лабинская ФРС 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's8', name: 'Соревнования МО Усть-Лабинский район «Кубок лета»', startDate: '2026-06-18T00:00:00.000Z', endDate: '2026-06-21T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Усть-Лабинская ФРС 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's9', name: 'Кубок юниоров', startDate: '2026-08-19T00:00:00.000Z', endDate: '2026-08-23T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: Адыгейская «ФРС» 8(918) 164-21-16 Юрий Михайлович', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's10', name: 'Карповая Лига Клондайка «Золотой Кубок памяти Яценко А.М»', startDate: '2026-09-02T00:00:00.000Z', endDate: '2026-09-06T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: Усть-Лабинская ФРС 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's11', name: 'Gentelmen CLUB', startDate: '2026-09-09T00:00:00.000Z', endDate: '2026-09-12T00:00:00.000Z', mealCost: 0, notes: 'коммерческий турнир\nОрганизатор: Gentelmen CLUB', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's12', name: 'Чемпионат Курской области по ловле карпа', startDate: '2026-09-30T00:00:00.000Z', endDate: '2026-10-03T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Курская ФРС 8(910) 279-64-44 Евгений', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
    { id: 's13', name: 'Соревнования МО Усть-Лабинский район «Кубанская осень»', startDate: '2026-11-05T00:00:00.000Z', endDate: '2026-11-08T00:00:00.000Z', mealCost: 0, notes: 'рейтинг\nОрганизатор: Усть-Лабинская ФРС 8(918) 440-77-08 Алексей', isArchived: false, createdAt: '2026-04-04T12:00:00.000Z', updatedAt: '2026-04-04T12:00:00.000Z', teams: [] },
  ]

  writeJSON(COMPETITIONS_FILE, competitions)
  writeJSON(TEAMS_FILE, [])
  fs.writeFileSync(markerFile, SEED_KEY)
}
