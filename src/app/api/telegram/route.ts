import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const TELEGRAM_CHAT_FILE = path.join(DATA_DIR, 'telegram_chat_id.txt')

export const dynamic = 'force-dynamic'

// GET /api/telegram — проверить статус (зарегистрирован ли chat_id)
export async function GET() {
  try {
    const chatId = getChatId()
    return NextResponse.json({
      configured: !!chatId,
      chatId: chatId ? `${chatId.slice(0, 4)}***` : null
    })
  } catch (error) {
    console.error('Telegram status error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// POST /api/telegram — зарегистрировать chat_id или отправить бэкап
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, message } = body

    // Регистрация chat_id
    if (chatId && !message) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(TELEGRAM_CHAT_FILE, String(chatId), 'utf-8')
      return NextResponse.json({ success: true, message: 'Chat ID сохранён' })
    }

    // Отправка бэкапа
    if (message) {
      const savedChatId = getChatId()
      if (!savedChatId) {
        return NextResponse.json({ error: 'Chat ID не настроен' }, { status: 400 })
      }

      const result = await sendTelegramFile(savedChatId, message, body.buffer)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Укажите chatId или message' }, { status: 400 })
  } catch (error) {
    console.error('Telegram error:', error)
    return NextResponse.json({ error: 'Ошибка Telegram' }, { status: 500 })
  }
}

// DELETE /api/telegram — удалить chat_id
export async function DELETE() {
  try {
    if (fs.existsSync(TELEGRAM_CHAT_FILE)) {
      fs.unlinkSync(TELEGRAM_CHAT_FILE)
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

// --- Helpers ---

function getChatId(): string | null {
  try {
    if (fs.existsSync(TELEGRAM_CHAT_FILE)) {
      return fs.readFileSync(TELEGRAM_CHAT_FILE, 'utf-8').trim()
    }
  } catch {}
  return null
}

async function sendTelegramFile(
  chatId: string,
  caption: string,
  bufferData?: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN не задан' }
  }

  // Формируем данные для отправки
  if (bufferData) {
    // Отправка как документ с файлом
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
    const buffer = Buffer.from(bufferData, 'base64')

    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="chat_id"`,
      '',
      chatId,
      `--${boundary}`,
      `Content-Disposition: form-data; name="caption"`,
      '',
      caption,
      `--${boundary}`,
      `Content-Disposition: form-data; name="document"; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      'Content-Type: application/json',
      '',
      buffer,
      `--${boundary}--`
    ].join('\r\n')

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: err }
    }
  } else {
    // Отправка как текстовое сообщение
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: caption })
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: err }
    }
  }

  return { success: true }
}

// Экспортируем helper для использования в schedule
export { getChatId, sendTelegramFile }
