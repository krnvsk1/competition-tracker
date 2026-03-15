import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// GET /api/competitions - получить все соревнования
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'
    
    const competitions = await db.competition.findMany({
      where: { isArchived: archived },
      include: {
        teams: true
      },
      orderBy: { date: 'asc' }
    })
    
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
    const { name, date, location, notes } = body
    
    if (!name || !date) {
      return NextResponse.json({ error: 'Название и дата обязательны' }, { status: 400 })
    }
    
    const competition = await db.competition.create({
      data: {
        name,
        date: new Date(date),
        location: location || '',
        notes: notes || ''
      }
    })
    
    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({ error: 'Ошибка при создании соревнования' }, { status: 500 })
  }
}
