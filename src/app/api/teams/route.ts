import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams - получить все команды
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')
    
    const teams = await db.team.findMany({
      where: competitionId ? { competitionId } : undefined,
      include: {
        competition: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
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
      mealPaid, 
      hasTelegram, 
      hasMaxMessenger, 
      notes,
      competitionId 
    } = body
    
    if (!name || !competitionId) {
      return NextResponse.json({ error: 'Название и соревнование обязательны' }, { status: 400 })
    }
    
    const team = await db.team.create({
      data: {
        name,
        contactName: contactName || '',
        phoneNumber: phoneNumber || '',
        participantCount: participantCount || 1,
        mealPaid: mealPaid || false,
        hasTelegram: hasTelegram || false,
        hasMaxMessenger: hasMaxMessenger || false,
        notes: notes || '',
        competitionId
      }
    })
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Ошибка при создании команды' }, { status: 500 })
  }
}
