import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/competitions/[id] - получить соревнование по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const competition = await db.competition.findUnique({
      where: { id },
      include: {
        teams: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    if (!competition) {
      return NextResponse.json({ error: 'Соревнование не найдено' }, { status: 404 })
    }
    
    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error fetching competition:', error)
    return NextResponse.json({ error: 'Ошибка при получении соревнования' }, { status: 500 })
  }
}

// PUT /api/competitions/[id] - обновить соревнование
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, date, location, notes, isArchived } = body
    
    const competition = await db.competition.update({
      where: { id },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        location,
        notes,
        isArchived
      }
    })
    
    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении соревнования' }, { status: 500 })
  }
}

// DELETE /api/competitions/[id] - удалить соревнование
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.competition.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Ошибка при удалении соревнования' }, { status: 500 })
  }
}
