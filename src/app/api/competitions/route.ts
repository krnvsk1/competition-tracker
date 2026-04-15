import { NextRequest, NextResponse } from 'next/server'
import { getCompetitions, createCompetition, seedIfEmpty, autoArchiveExpiredCompetitions } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// GET /api/competitions - получить все соревнования
export async function GET(request: NextRequest) {
  try {
    seedIfEmpty()
    autoArchiveExpiredCompetitions()

    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'

    const competitions = getCompetitions(archived)
    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json({ error: 'Ошибка при получении соревнований' }, { status: 500 })
  }
}

// POST /api/competitions - создать соревнование
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, startDate, endDate, mealCost, organizerName, organizerPhone, notes } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Название и период обязательны' }, { status: 400 })
    }

    const competition = createCompetition({ name, startDate, endDate, mealCost, organizerName, organizerPhone, notes })
    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({ error: 'Ошибка при создании соревнования' }, { status: 500 })
  }
}
