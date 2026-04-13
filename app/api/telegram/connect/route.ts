import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ORG_UID } from '@/lib/constants'

const N8N_BASE = 'https://n8n.srv1090249.hstgr.cloud/api/v1'
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMjhkYWM1Yi01ZmEyLTRiNWUtYTcyOS03NmE4MzI1YWNiNzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjkxMjE4ZDEtY2JmZC00YmFlLWE2ZjQtZWI5OGNhYjNjYTI3IiwiaWF0IjoxNzc1NDc2NDAzfQ.aCtDzJ0bnIIrlRZgixs_4yH_iNpB1FKAV7uOU9OxYeg'
const TEMPLATE_WORKFLOW_ID = 'YRc6sHkXYOsM4bDH'

function n8nFetch(path: string, init?: RequestInit) {
  return fetch(`${N8N_BASE}${path}`, {
    ...init,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

async function createN8nCredential(botUsername: string, token: string): Promise<string> {
  const res = await n8nFetch('/credentials', {
    method: 'POST',
    body: JSON.stringify({
      name: `@${botUsername}`,
      type: 'telegramApi',
      data: { accessToken: token },
    }),
  })
  if (!res.ok) throw new Error(`n8n credential create failed: ${await res.text()}`)
  const data = await res.json()
  return data.id as string
}

async function deleteN8nCredential(credentialId: string) {
  await n8nFetch(`/credentials/${credentialId}`, { method: 'DELETE' }).catch(() => {})
}

async function cloneAndActivateWorkflow(credentialId: string, botUsername: string): Promise<string> {
  // 1. Fetch template
  const tplRes = await n8nFetch(`/workflows/${TEMPLATE_WORKFLOW_ID}`)
  if (!tplRes.ok) throw new Error('Failed to fetch template workflow')
  const tpl = await tplRes.json()

  // 2. Strip read-only fields
  const { id, updatedAt, createdAt, isArchived, versionId, activeVersionId,
          versionCounter, triggerCount, activeVersion, tags, shared,
          description, meta, pinData, active, ...cleanTpl } = tpl

  // 3. Update Telegram Trigger credential + workflow name
  cleanTpl.name = `AiAdmin — @${botUsername}`
  cleanTpl.nodes = (cleanTpl.nodes as Array<Record<string, unknown>>).map((node) => {
    if (node.type === 'n8n-nodes-base.telegramTrigger') {
      return {
        ...node,
        credentials: {
          telegramApi: { id: credentialId, name: `@${botUsername}` },
        },
      }
    }
    return node
  })

  // Keep only allowed settings keys
  cleanTpl.settings = {
    executionOrder: (cleanTpl.settings as Record<string, unknown>)?.executionOrder ?? 'v1',
    callerPolicy: (cleanTpl.settings as Record<string, unknown>)?.callerPolicy ?? 'workflowsFromSameOwner',
  }

  // 4. Create new workflow
  const createRes = await n8nFetch('/workflows', {
    method: 'POST',
    body: JSON.stringify(cleanTpl),
  })
  if (!createRes.ok) throw new Error(`Failed to create workflow: ${await createRes.text()}`)
  const created = await createRes.json()
  const workflowId = created.id as string

  // 5. Activate
  await n8nFetch(`/workflows/${workflowId}/activate`, { method: 'POST' })

  return workflowId
}

async function deleteN8nWorkflow(workflowId: string) {
  // Deactivate first, then delete
  await n8nFetch(`/workflows/${workflowId}/deactivate`, { method: 'POST' }).catch(() => {})
  await n8nFetch(`/workflows/${workflowId}`, { method: 'DELETE' }).catch(() => {})
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || !token.includes(':')) {
      return NextResponse.json({ ok: false, error: 'Некорректный токен' }, { status: 400 })
    }

    // 1. Validate token via Telegram
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: 'no-store' })
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

    // 2. Get current org state
    const admin = createAdminClient()
    const { data: org } = await admin
      .from('org_settings')
      .select('n8n_credential_id, n8n_workflow_id')
      .eq('org_uid', DEFAULT_ORG_UID)
      .single()

    // 3. Clean up old n8n resources if they exist
    if (org?.n8n_workflow_id) {
      await deleteN8nWorkflow(org.n8n_workflow_id)
    }
    if (org?.n8n_credential_id) {
      await deleteN8nCredential(org.n8n_credential_id)
    }

    // 4. Create n8n credential with the bot token
    let credentialId: string
    let workflowId: string
    try {
      credentialId = await createN8nCredential(botUsername, token)
    } catch (e) {
      console.error('[telegram/connect] credential create:', e)
      return NextResponse.json({ ok: false, error: 'Не удалось создать подключение в n8n' }, { status: 500 })
    }

    // 5. Clone template workflow, assign credential, activate
    try {
      workflowId = await cloneAndActivateWorkflow(credentialId, botUsername)
    } catch (e) {
      console.error('[telegram/connect] workflow clone:', e)
      // Rollback credential
      await deleteN8nCredential(credentialId)
      return NextResponse.json({ ok: false, error: 'Не удалось запустить агента' }, { status: 500 })
    }

    // 6. Save everything to org_settings
    const { error } = await admin
      .from('org_settings')
      .update({
        telegram_bot_token: token,
        telegram_bot_name: botName,
        telegram_bot_username: botUsername,
        telegram_connected: true,
        n8n_credential_id: credentialId,
        n8n_workflow_id: workflowId,
        updated_at: new Date().toISOString(),
      })
      .eq('org_uid', DEFAULT_ORG_UID)

    if (error) {
      // Rollback n8n resources
      await deleteN8nWorkflow(workflowId)
      await deleteN8nCredential(credentialId)
      return NextResponse.json({ ok: false, error: 'Ошибка сохранения' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, bot_name: botName, bot_username: botUsername })
  } catch (e) {
    console.error('[telegram/connect]', e)
    return NextResponse.json({ ok: false, error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const admin = createAdminClient()

    const { data: org } = await admin
      .from('org_settings')
      .select('telegram_bot_token, n8n_credential_id, n8n_workflow_id')
      .eq('org_uid', DEFAULT_ORG_UID)
      .single()

    // Delete n8n workflow (also removes webhook registration from Telegram)
    if (org?.n8n_workflow_id) {
      await deleteN8nWorkflow(org.n8n_workflow_id)
    }
    if (org?.n8n_credential_id) {
      await deleteN8nCredential(org.n8n_credential_id)
    }

    // Manually delete webhook from Telegram as well (belt and suspenders)
    if (org?.telegram_bot_token) {
      await fetch(`https://api.telegram.org/bot${org.telegram_bot_token}/deleteWebhook`, {
        method: 'POST',
      }).catch(() => {})
    }

    await admin
      .from('org_settings')
      .update({
        telegram_bot_token: null,
        telegram_bot_name: null,
        telegram_bot_username: null,
        telegram_connected: false,
        n8n_credential_id: null,
        n8n_workflow_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_uid', DEFAULT_ORG_UID)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[telegram/connect DELETE]', e)
    return NextResponse.json({ ok: false, error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
