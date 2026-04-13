import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORT_BOT_TOKEN = '8776264530:AAE_kckrSbDDJpUspCnMVFp3MpAhQFGoM0A'
const TG_API = `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}`

async function tgCall(method: string, body: Record<string, unknown>) {
  return fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Handle inline button press
    if (update.callback_query) {
      const query = update.callback_query
      const data: string = query.data ?? ''

      if (data.startsWith('whatsapp_done:')) {
        const orgUid = data.replace('whatsapp_done:', '')
        const admin = createAdminClient()

        await admin
          .from('org_settings')
          .update({
            whatsapp_connected: true,
            whatsapp_pending: false,
            updated_at: new Date().toISOString(),
          })
          .eq('org_uid', orgUid)

        // Confirm to Telegram (removes loading spinner on button)
        await tgCall('answerCallbackQuery', {
          callback_query_id: query.id,
          text: '✅ WhatsApp отмечен как подключённый',
        })

        // Edit original message to show completion
        const msg = query.message
        if (msg) {
          await tgCall('editMessageText', {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            text: msg.text + '\n\n✅ <b>Выполнено</b>',
            parse_mode: 'HTML',
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Always 200 to Telegram
  }
}
