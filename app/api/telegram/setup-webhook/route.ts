import { NextRequest, NextResponse } from 'next/server'

const SUPPORT_BOT_TOKEN = '8776264530:AAE_kckrSbDDJpUspCnMVFp3MpAhQFGoM0A'

// GET /api/telegram/setup-webhook?url=https://your-domain.com
// Call once after deploy to register the Telegram webhook
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const baseUrl = searchParams.get('url') ?? `https://${request.headers.get('host')}`
  const webhookUrl = `${baseUrl}/api/telegram/support-webhook`

  const res = await fetch(
    `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
