import { NextRequest, NextResponse } from 'next/server'
import { getTeamById, updateTeam, deleteTeam } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// GET /api/teams/[id] - получить команду по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const team = getTeamById(id)

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
      mealDays,
      mealPaid,
      hasTelegram,
      hasMaxMessenger,
      hasPhoneContact,
      notes
    } = body

    const team = updateTeam(id, {
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
      notes
    })

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

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
    const success = deleteTeam(id)

    if (!success) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Ошибка при удалении команды' }, { status: 500 })
  }
}
