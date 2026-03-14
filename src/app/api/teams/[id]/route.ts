import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams/[id] - получить команду по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const team = await db.team.findUnique({
      where: { id },
      include: {
        competition: true
      }
    })
    
    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Ошибка при получении команды' }, { status: 500 })
  }
}

// PUT /api/teams/[id] - обновить команду
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      contactName, 
      phoneNumber, 
      participantCount, 
      mealPaid, 
      hasTelegram, 
      hasMaxMessenger, 
      notes 
    } = body
    
    const team = await db.team.update({
      where: { id },
      data: {
        name,
        contactName,
        phoneNumber,
        participantCount,
        mealPaid,
        hasTelegram,
        hasMaxMessenger,
        notes
      }
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении команды' }, { status: 500 })
  }
}

// DELETE /api/teams/[id] - удалить команду
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.team.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Ошибка при удалении команды' }, { status: 500 })
  }
}
