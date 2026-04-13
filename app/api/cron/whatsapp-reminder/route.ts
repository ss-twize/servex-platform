import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORT_BOT_TOKEN = '8776264530:AAE_kckrSbDDJpUspCnMVFp3MpAhQFGoM0A'
const SUPPORT_CHAT_ID = '6420087545'
const TG_API = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}`
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

export async function GET() {
  try {
    const admin = createAdminClient()

    // Find orgs with pending WhatsApp requests older than 8 hours, reminder not yet sent
    const cutoff = new Date(Date.now() - EIGHT_HOURS_MS).toISOString()

    const { data: orgs } = await admin
      .from('org_settings')
      .select('org_uid, salon_name, phone, owner_telegram, whatsapp_request_sent_at')
      .eq('whatsapp_pending', true)
      .eq('whatsapp_reminder_sent', false)
      .lt('whatsapp_request_sent_at', cutoff)

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ ok: true, checked: 0 })
    }

    for (const org of orgs) {
      const salonName = org.salon_name ?? 'Не указано'
      const phone = org.phone ?? 'Не указан'
      const ownerTelegram = org.owner_telegram ?? 'Не указан'

      const message =
        `🚨 <b>СРОЧНО — Заявка на WhatsApp без ответа 8+ часов</b>\n\n` +
        `🏢 Салон: <b>${salonName}</b>\n` +
        `📞 Телефон: <b>${phone}</b>\n` +
        `💬 Telegram: <b>${ownerTelegram}</b>\n` +
        `🔑 org_uid: <code>${org.org_uid}</code>\n\n` +
        `Клиент ожидает подключения WhatsApp!`

      await fetch(`${TG_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPPORT_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Готово', callback_data: `whatsapp_done:${org.org_uid}` },
            ]],
          },
        }),
      })

      await admin
        .from('org_settings')
        .update({ whatsapp_reminder_sent: true, updated_at: new Date().toISOString() })
        .eq('org_uid', org.org_uid)
    }

    return NextResponse.json({ ok: true, reminded: orgs.length })
  } catch (err) {
    console.error('[cron/whatsapp-reminder]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
