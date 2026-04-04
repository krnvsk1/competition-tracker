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

  const now = new Date().toISOString()
  competitions[idx] = {
    ...competitions[idx],
    ...data,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : competitions[idx].startDate,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : competitions[idx].endDate,
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
