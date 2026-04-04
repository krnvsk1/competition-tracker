import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const COMPETITIONS_FILE = path.join(DATA_DIR, 'competitions.json')
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json')
const TELEGRAM_CHAT_FILE = path.join(DATA_DIR, 'telegram_chat_id.txt')

export const dynamic = 'force-dynamic'

// GET /api/backup/schedule — триггер для cron-job.org
// Экспортирует данные и отправляет через Telegram
export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не настроен' }, { status: 500 })
    }

    // Читаем chat_id
    let chatId: string | null = null
    try {
      if (fs.existsSync(TELEGRAM_CHAT_FILE)) {
        chatId = fs.readFileSync(TELEGRAM_CHAT_FILE, 'utf-8').trim()
      }
    } catch {}

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID не настроен' }, { status: 400 })
    }

    // Читаем данные
    function readJSON<T>(filePath: string): T[] {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[]
      } catch {
        return []
      }
    }

    const competitions = readJSON(COMPETITIONS_FILE)
    const teams = readJSON(TEAMS_FILE)

    const backupData = {
      exportedAt: new Date().toISOString(),
      competitions,
      teams
    }

    const jsonStr = JSON.stringify(backupData, null, 2)

    // Отправляем через Telegram Bot API как документ
    const filename = `competition-tracker-${new Date().toISOString().slice(0, 10)}.json`
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)

    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="chat_id"`,
      '',
      chatId,
      `--${boundary}`,
      `Content-Disposition: form-data; name="caption"`,
      '',
      `📦 Бэкап Competition Tracker\n📅 ${new Date().toLocaleDateString('ru-RU')}\n📋 ${competitions.length} соревн., ${teams.length} команд`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="document"; filename="${filename}"`,
      'Content-Type: application/json',
      '',
      jsonStr,
      `--${boundary}--`
    ].join('\r\n')

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Telegram send error:', errText)
      return NextResponse.json({ error: 'Ошибка отправки в Telegram' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Бэкап отправлен: ${competitions.length} соревнований, ${teams.length} команд`
    })
  } catch (error) {
    console.error('Schedule backup error:', error)
    return NextResponse.json({ error: 'Ошибка при создании бэкапа' }, { status: 500 })
  }
}
