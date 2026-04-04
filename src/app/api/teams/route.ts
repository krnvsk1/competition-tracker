import { NextRequest, NextResponse } from 'next/server'
import { getTeams, createTeam } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// GET /api/teams - получить все команды
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId') || undefined

    const teams = getTeams(competitionId)
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Ошибка при получении команд' }, { status: 500 })
  }
}

// POST /api/teams - создать команду
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      contactName,
      phoneNumber,
      participantCount,
      mealDays,
      mealPaid,
      hasTelegram,
      hasMaxMessenger,
      hasPhoneContact,
      notes,
      competitionId
    } = body

    if (!name || !competitionId) {
      return NextResponse.json({ error: 'Название и соревнование обязательны' }, { status: 400 })
    }

    const team = createTeam({
      name,
      contactName,
      phoneNumber,
      participantCount,
      mealDays,
      mealPaid,
      hasTelegram,
      hasMaxMessenger,
      hasPhoneContact,
      hasWhatsApp,
      notes,
      competitionId
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Ошибка при создании команды' }, { status: 500 })
  }
}
