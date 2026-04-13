-- yclients_integrations
CREATE TABLE IF NOT EXISTS yclients_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid UUID NOT NULL,
  salon_id TEXT NOT NULL,
  salon_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending_activation'
    CHECK (status IN ('pending_activation','activation_failed','active','syncing','degraded','disconnected')),
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_webhook_at TIMESTAMPTZ,
  sync_error TEXT,
  source TEXT DEFAULT 'marketplace',
  raw_user_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_uid, salon_id)
);

-- yclients_integration_attempts
CREATE TABLE IF NOT EXISTS yclients_integration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid UUID,
  salon_id TEXT,
  flow_type TEXT CHECK (flow_type IN ('signup','login','reconnect')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  activate_started_at TIMESTAMPTZ,
  activate_finished_at TIMESTAMPTZ,
  result TEXT,
  error_message TEXT
);

-- yclients_webhook_events
CREATE TABLE IF NOT EXISTS yclients_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id TEXT,
  resource TEXT,
  resource_id TEXT,
  status TEXT,
  payload_json JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_result TEXT,
  dedupe_key TEXT UNIQUE
);

-- yclients_sync_jobs
CREATE TABLE IF NOT EXISTS yclients_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES yclients_integrations(id) ON DELETE CASCADE,
  job_type TEXT CHECK (job_type IN ('initial','delta','reconcile','full_resync')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE yclients_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yclients_integration_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yclients_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE yclients_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_yclients_integrations" ON yclients_integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_all_yclients_integrations" ON yclients_integrations FOR ALL TO service_role USING (true);
CREATE POLICY "auth_read_yclients_attempts" ON yclients_integration_attempts FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_yclients_attempts" ON yclients_integration_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "auth_read_yclients_events" ON yclients_webhook_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_yclients_events" ON yclients_webhook_events FOR ALL TO service_role USING (true);
CREATE POLICY "auth_read_yclients_sync" ON yclients_sync_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_all_yclients_sync" ON yclients_sync_jobs FOR ALL TO service_role USING (true);
