import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ORG_UID } from '@/lib/constants'

const SUPPORT_BOT_TOKEN = '8776264530:AAE_kckrSbDDJpUspCnMVFp3MpAhQFGoM0A'
const SUPPORT_CHAT_ID = '6420087545'

export async function POST() {
  try {
    const admin = createAdminClient()

    // Get org info to include in notification
    const { data: org } = await admin
      .from('org_settings')
      .select('salon_name, phone, owner_telegram, whatsapp_pending')
      .eq('org_uid', DEFAULT_ORG_UID)
      .single()

    if (org?.whatsapp_pending) {
      return NextResponse.json({ ok: true, already_pending: true })
    }

    const salonName = org?.salon_name ?? 'Не указано'
    const phone = org?.phone ?? 'Не указан'
    const ownerTelegram = org?.owner_telegram ?? 'Не указан'

    // Send Telegram notification to support
    const message =
      `📱 <b>Заявка на подключение WhatsApp</b>\n\n` +
      `🏢 Салон: <b>${salonName}</b>\n` +
      `📞 Телефон: <b>${phone}</b>\n` +
      `💬 Telegram: <b>${ownerTelegram}</b>\n` +
      `🔑 org_uid: <code>${DEFAULT_ORG_UID}</code>\n\n` +
      `Необходимо настроить Green-API инстанс и заполнить поля\n` +
      `<code>whatsapp_id_instance</code> и <code>whatsapp_api_token_instance</code>\n` +
      `в таблице <code>org_settings</code>.`

    const now = new Date().toISOString()

    const tgRes = await fetch(
      `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPPORT_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Готово', callback_data: `whatsapp_done:${DEFAULT_ORG_UID}` },
            ]],
          },
        }),
      }
    )

    if (!tgRes.ok) {
      const err = await tgRes.text().catch(() => '')
      console.error('[whatsapp/request] Telegram error:', err)
      return NextResponse.json({ ok: false, error: 'Не удалось отправить уведомление' }, { status: 500 })
    }

    // Mark as pending with timestamp
    await admin
      .from('org_settings')
      .update({
        whatsapp_pending: true,
        whatsapp_request_sent_at: now,
        whatsapp_reminder_sent: false,
        updated_at: now,
      })
      .eq('org_uid', DEFAULT_ORG_UID)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp/request]', err)
    return NextResponse.json({ ok: false, error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
