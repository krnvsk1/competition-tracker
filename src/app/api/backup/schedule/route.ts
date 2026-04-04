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
      return NextResponse.json({
        error: 'Chat ID не настроен',
        hint: 'Откройте меню "Соревнования" → "Подключить Telegram" на сайте'
      }, { status: 400 })
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
    const jsonBuffer = Buffer.from(jsonStr, 'utf-8')

    // Отправляем через Telegram Bot API как документ
    const filename = `competition-tracker-${new Date().toISOString().slice(0, 10)}.json`
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
    const caption = `📦 Бэкап Competition Tracker\n📅 ${new Date().toLocaleDateString('ru-RU')}\n📋 ${competitions.length} соревн., ${teams.length} команд`

    const parts: Buffer[] = []

    function addField(name: string, value: string) {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
    }

    function addFile(name: string, fname: string, contentType: string, data: Buffer) {
      const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${fname}"\r\nContent-Type: ${contentType}\r\n\r\n`
      )
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
      parts.push(header, data, footer)
    }

    addField('chat_id', chatId)
    addField('caption', caption)
    addFile('document', filename, 'application/json', jsonBuffer)

    const body = Buffer.concat(parts)

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length)
      },
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
