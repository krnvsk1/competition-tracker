import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const COMPETITIONS_FILE = path.join(DATA_DIR, 'competitions.json')
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json')

export const dynamic = 'force-dynamic'

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

// GET /api/data — экспорт всех данных
export async function GET() {
  try {
    const competitions = readJSON(COMPETITIONS_FILE)
    const teams = readJSON(TEAMS_FILE)

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      competitions,
      teams
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Ошибка при экспорте данных' }, { status: 500 })
  }
}

// POST /api/data — импорт данных
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitions, teams } = body

    if (!Array.isArray(competitions)) {
      return NextResponse.json({ error: 'Неверный формат данных: отсутствуют competitions' }, { status: 400 })
    }
    if (!Array.isArray(teams)) {
      return NextResponse.json({ error: 'Неверный формат данных: отсутствуют teams' }, { status: 400 })
    }

    // Валидация базовой структуры
    for (const c of competitions) {
      if (!c.id || !c.name) {
        return NextResponse.json({ error: `Неверный формат соревнования: отсутствует id или name` }, { status: 400 })
      }
    }
    for (const t of teams) {
      if (!t.id || !t.competitionId) {
        return NextResponse.json({ error: `Неверный формат команды: отсутствует id или competitionId` }, { status: 400 })
      }
    }

    // Перезаписываем файлы
    writeJSON(COMPETITIONS_FILE, competitions)
    writeJSON(TEAMS_FILE, teams)

    return NextResponse.json({
      success: true,
      message: `Импортировано: ${competitions.length} соревнований, ${teams.length} команд`
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Ошибка при импорте данных' }, { status: 500 })
  }
}
