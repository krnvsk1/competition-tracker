import { NextRequest, NextResponse } from 'next/server'
import { getCompetitionById, updateCompetition, deleteCompetition } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// GET /api/competitions/[id] - получить соревнование по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competition = getCompetitionById(id)

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
    const { name, date, mealCost, notes, isArchived } = body

    const competition = updateCompetition(id, {
      name,
      date,
      mealCost,
      notes,
      isArchived
    })

    if (!competition) {
      return NextResponse.json({ error: 'Соревнование не найдено' }, { status: 404 })
    }

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
    const success = deleteCompetition(id)

    if (!success) {
      return NextResponse.json({ error: 'Соревнование не найдено' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({ error: 'Ошибка при удалении соревнования' }, { status: 500 })
  }
}
