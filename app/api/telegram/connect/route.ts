import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- DELETE handler doesn't need request
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || !token.includes(':')) {
      return NextResponse.json({ ok: false, error: 'Некорректный токен' }, { status: 400 })
    }

    // Validate token via Telegram API
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      cache: 'no-store',
    })

    if (!tgRes.ok) {
      return NextResponse.json({ ok: false, error: 'Telegram отклонил токен — проверьте правильность' }, { status: 400 })
    }

    const tgData = await tgRes.json()

    if (!tgData.ok) {
      return NextResponse.json({ ok: false, error: tgData.description ?? 'Недействительный токен' }, { status: 400 })
    }

    const bot = tgData.result
    const botName = bot.first_name as string
    const botUsername = bot.username as string

    // Save to org_settings
    const admin = createAdminClient()
    const { error } = await admin
      .from('org_settings')
      .update({
        telegram_bot_token: token,
        telegram_bot_name: botName,
        telegram_bot_username: botUsername,
        telegram_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq('org_uid', DEFAULT_ORG_UID)

    if (error) {
      return NextResponse.json({ ok: false, error: 'Ошибка сохранения' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, bot_name: botName, bot_username: botUsername })
  } catch {
    return NextResponse.json({ ok: false, error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const admin = createAdminClient()
    await admin
      .from('org_settings')
      .update({
        telegram_bot_token: null,
        telegram_bot_name: null,
        telegram_bot_username: null,
        telegram_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('org_uid', DEFAULT_ORG_UID)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
