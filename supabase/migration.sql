-- =============================================
-- SERVEX Platform: Full Schema Migration
-- Fresh database — no existing tables
-- Supabase project: qjqwmsusxuekkzmuiyqc
-- =============================================

-- =============================================================================
-- GROUP C: PLATFORM TABLES (created first — no dependencies)
-- =============================================================================

-- Настройки организации
CREATE TABLE org_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid                  UUID UNIQUE NOT NULL,
  salon_name               TEXT DEFAULT 'Мой бизнес',
  contacts_import_source   TEXT DEFAULT 'yclients',
  greeting_message         TEXT DEFAULT 'Привет! Чем могу помочь?',
  work_start               TIME DEFAULT '09:00',
  work_end                 TIME DEFAULT '21:00',
  active_threshold_days    INTEGER DEFAULT 30,
  at_risk_threshold_days   INTEGER DEFAULT 50,
  inactive_threshold_days  INTEGER DEFAULT 90,
  vip_visits_threshold     INTEGER DEFAULT 10,
  vip_revenue_threshold    NUMERIC DEFAULT 50000,
  timezone                 TEXT DEFAULT 'Europe/Moscow',
  currency                 TEXT DEFAULT 'RUB',
  address                  TEXT,
  phone                    TEXT,
  map_url                  TEXT,
  yclients_company_id      TEXT,
  yclients_connected       BOOLEAN DEFAULT false,
  telegram_connected       BOOLEAN DEFAULT false,
  whatsapp_connected       BOOLEAN DEFAULT false,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- Состояния автосистем
CREATE TABLE system_states (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid      UUID NOT NULL,
  system_code  TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  enabled      BOOLEAN DEFAULT false,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_uid, system_code)
);

-- Рейтинги на картах (Яндекс / 2ГИС)
CREATE TABLE map_ratings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid        UUID NOT NULL,
  source         TEXT NOT NULL CHECK (source IN ('яндекс', '2гис')),
  rating         NUMERIC(3,1) DEFAULT 0,
  reviews_count  INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_uid, source)
);

-- База знаний (файлы)
CREATE TABLE knowledge_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid      UUID NOT NULL,
  name         TEXT NOT NULL,
  file_type    TEXT,
  storage_url  TEXT,
  drive_url    TEXT,
  content      TEXT,
  status       TEXT DEFAULT 'загружен',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Журнал действий (вебхук-вызовы)
CREATE TABLE action_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid        UUID NOT NULL,
  action_code    TEXT NOT NULL,
  params         JSONB,
  status         TEXT DEFAULT 'успех',
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Метрики за день
CREATE TABLE metrics_day (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid             UUID NOT NULL,
  date                DATE NOT NULL,
  unique_contacts     INTEGER DEFAULT 0,
  incoming_messages   INTEGER DEFAULT 0,
  outgoing_messages   INTEGER DEFAULT 0,
  appointments        INTEGER DEFAULT 0,
  revenue             NUMERIC DEFAULT 0,
  no_shows            INTEGER DEFAULT 0,
  new_clients         INTEGER DEFAULT 0,
  UNIQUE (org_uid, date)
);

-- Метрики за месяц
CREATE TABLE metrics_month (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid             UUID NOT NULL,
  month               DATE NOT NULL,
  unique_contacts     INTEGER DEFAULT 0,
  incoming_messages   INTEGER DEFAULT 0,
  outgoing_messages   INTEGER DEFAULT 0,
  appointments        INTEGER DEFAULT 0,
  revenue             NUMERIC DEFAULT 0,
  no_shows            INTEGER DEFAULT 0,
  new_clients         INTEGER DEFAULT 0,
  avg_check           NUMERIC DEFAULT 0,
  UNIQUE (org_uid, month)
);

-- Реестр вебхуков
CREATE TABLE webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid      UUID NOT NULL,
  action_code  TEXT NOT NULL,
  url          TEXT NOT NULL,
  enabled      BOOLEAN DEFAULT true,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_uid, action_code)
);

-- =============================================================================
-- GROUP B: CHANNEL CONNECTIONS (GREEN-API)
-- =============================================================================

-- Подключения каналов (WhatsApp / Max через GREEN-API)
CREATE TABLE channel_connections (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid              UUID NOT NULL,
  channel_code         TEXT NOT NULL,
  provider             TEXT NOT NULL DEFAULT 'green_api',
  status               TEXT NOT NULL DEFAULT 'disconnected',
  display_name         TEXT,
  external_account_id  TEXT,
  instance_id          TEXT,
  api_url              TEXT,
  media_url            TEXT,
  api_token            TEXT,
  webhook_url          TEXT,
  last_checked_at      TIMESTAMPTZ,
  connected_at         TIMESTAMPTZ,
  disconnected_at      TIMESTAMPTZ,
  error_code           TEXT,
  error_message        TEXT,
  meta                 JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_uid, channel_code)
);

CREATE TABLE channel_connection_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id  UUID REFERENCES channel_connections(id) ON DELETE CASCADE,
  event_code     TEXT NOT NULL,
  payload        JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- GROUP A: AGENT TABLES (n8n writes via service_role, UI reads)
-- clients must come before *_users tables due to FK
-- =============================================================================

-- Клиенты (полная схема со всеми колонками)
CREATE TABLE clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid               UUID NOT NULL,
  fullname              TEXT NOT NULL,
  phone                 TEXT,
  gender                TEXT CHECK (gender IN ('мужской', 'женский') OR gender IS NULL),
  yc_id                 TEXT,
  yclients_id           BIGINT,
  telegram_user_id      BIGINT,
  whatsapp_user_id      TEXT,
  max_user_id           TEXT,
  lifecycle_status      TEXT NOT NULL DEFAULT 'lead'
                          CHECK (lifecycle_status IN ('lead', 'client', 'inactive')),
  source_channel        TEXT
                          CHECK (source_channel IN ('telegram', 'whatsapp', 'max', 'yclients', 'manual')),
  name                  TEXT,
  surname               TEXT,
  patronymic            TEXT,
  display_name          TEXT,
  email                 TEXT,
  birth_date            TEXT,
  comment               TEXT,
  discount              NUMERIC DEFAULT 0,
  visits                INTEGER DEFAULT 0,
  spent                 NUMERIC DEFAULT 0,
  paid                  NUMERIC DEFAULT 0,
  balance               NUMERIC DEFAULT 0,
  avg_check             NUMERIC DEFAULT 0,
  ltv                   NUMERIC DEFAULT 0,
  first_visit           TIMESTAMPTZ,
  last_visit            TIMESTAMPTZ,
  last_message          TIMESTAMPTZ,
  last_change_date      TIMESTAMPTZ,
  importance            TEXT,
  importance_id         INTEGER DEFAULT 0,
  categories            JSONB DEFAULT '[]',
  custom_fields         JSONB DEFAULT '{}',
  sms_check             INTEGER DEFAULT 0,
  sms_bot               INTEGER DEFAULT 0,
  sms_not               INTEGER DEFAULT 0,
  sex                   TEXT,
  sex_id                INTEGER DEFAULT 0,
  age                   INTEGER,
  cancel_count          INTEGER DEFAULT 0,
  no_show_count         INTEGER DEFAULT 0,
  source                TEXT,
  city                  TEXT,
  branch                TEXT,
  master                TEXT,
  services              JSONB DEFAULT '[]',
  favorite_service      TEXT,
  channel               TEXT,
  tags                  JSONB DEFAULT '[]',
  notes                 TEXT,
  wa_check_status       TEXT DEFAULT 'unchecked',
  communication_activity TEXT DEFAULT 'ignored',
  has_bonuses           BOOLEAN DEFAULT false,
  has_subscription      BOOLEAN DEFAULT false,
  has_deposit           BOOLEAN DEFAULT false,
  reacted_to_offers     BOOLEAN DEFAULT false,
  raw_payload           JSONB,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ,
  UNIQUE (org_uid, yc_id)
);

-- Пользователи Telegram
CREATE TABLE telegram_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid          UUID NOT NULL,
  user_id          BIGINT NOT NULL,
  yc_id            TEXT,
  yclients_id      BIGINT,
  client_fullname  TEXT,
  client_phone     TEXT,
  tg_username      TEXT,
  first_name       TEXT,
  last_name        TEXT,
  blocked          BOOLEAN DEFAULT false,
  allow_marketing  BOOLEAN DEFAULT true,
  can_message      BOOLEAN DEFAULT true,
  last_message     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  UNIQUE (org_uid, user_id)
);

-- Пользователи WhatsApp
CREATE TABLE whatsapp_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid          UUID NOT NULL,
  user_id          TEXT NOT NULL,
  yc_id            TEXT,
  yclients_id      BIGINT,
  client_fullname  TEXT,
  client_phone     TEXT,
  first_name       TEXT,
  last_name        TEXT,
  blocked          BOOLEAN DEFAULT false,
  allow_marketing  BOOLEAN DEFAULT true,
  can_message      BOOLEAN DEFAULT true,
  last_message     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  UNIQUE (org_uid, user_id)
);

-- Пользователи Max
CREATE TABLE max_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid          UUID NOT NULL,
  user_id          TEXT NOT NULL,
  yc_id            TEXT,
  yclients_id      BIGINT,
  client_fullname  TEXT,
  client_phone     TEXT,
  first_name       TEXT,
  last_name        TEXT,
  blocked          BOOLEAN DEFAULT false,
  allow_marketing  BOOLEAN DEFAULT true,
  can_message      BOOLEAN DEFAULT true,
  last_message     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  UNIQUE (org_uid, user_id)
);

-- Записи (визиты)
CREATE TABLE appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_uid       UUID NOT NULL,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  yc_id         TEXT,
  client_name   TEXT,
  phone         TEXT,
  contact       TEXT,
  status        TEXT,
  service_name  TEXT,
  service_id    TEXT,
  master_id     TEXT,
  master_name   TEXT,
  date          TIMESTAMPTZ,
  duration_min  INTEGER,
  price         NUMERIC,
  comment       TEXT,
  record_id     TEXT NOT NULL UNIQUE,
  record_hash   TEXT NOT NULL UNIQUE,
  reminder_1h   BOOLEAN DEFAULT false,
  reminder_2h   BOOLEAN DEFAULT false,
  reminder_12h  BOOLEAN DEFAULT false,
  reminder_8am  BOOLEAN DEFAULT false,
  reminder_24h  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Каналы связи клиента (маршрутизация уведомлений)
CREATE TABLE client_channels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel          TEXT NOT NULL CHECK (channel IN ('telegram', 'whatsapp', 'max', 'phone')),
  channel_user_id  TEXT NOT NULL,
  priority         INTEGER NOT NULL DEFAULT 99,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  can_notify       BOOLEAN NOT NULL DEFAULT true,
  identified_via   TEXT,
  last_used        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, channel)
);

-- =============================================================================
-- GROUP D: AUTH
-- =============================================================================

CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_uid      UUID NOT NULL,
  role         TEXT NOT NULL DEFAULT 'владелец'
                 CHECK (role IN ('владелец', 'администратор')),
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Agent tables
CREATE INDEX idx_telegram_users_org_user   ON telegram_users (org_uid, user_id);
CREATE INDEX idx_telegram_users_client_id  ON telegram_users (client_id);
CREATE INDEX idx_whatsapp_users_org_user   ON whatsapp_users (org_uid, user_id);
CREATE INDEX idx_whatsapp_users_client_id  ON whatsapp_users (client_id);
CREATE INDEX idx_max_users_org_user        ON max_users (org_uid, user_id);
CREATE INDEX idx_max_users_client_id       ON max_users (client_id);
CREATE INDEX idx_clients_org               ON clients (org_uid);
CREATE INDEX idx_clients_phone             ON clients (phone);
CREATE INDEX idx_clients_yc_id             ON clients (yc_id);
CREATE INDEX idx_clients_lifecycle         ON clients (org_uid, lifecycle_status);
CREATE INDEX idx_clients_source_channel    ON clients (org_uid, source_channel);
CREATE INDEX idx_clients_last_visit        ON clients (org_uid, last_visit);
CREATE INDEX idx_appointments_org_date     ON appointments (org_uid, date);
CREATE INDEX idx_appointments_client_id    ON appointments (client_id);
CREATE INDEX idx_appointments_status       ON appointments (status);
CREATE INDEX idx_client_channels_routing   ON client_channels (client_id, is_active, can_notify, priority);
CREATE INDEX idx_client_channels_lookup    ON client_channels (channel, channel_user_id);

-- Platform tables
CREATE INDEX idx_action_log_org_date       ON action_log (org_uid, created_at DESC);
CREATE INDEX idx_metrics_day_org_date      ON metrics_day (org_uid, date DESC);
CREATE INDEX idx_metrics_month_org_month   ON metrics_month (org_uid, month DESC);

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- 1. Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER client_channels_updated_at
  BEFORE UPDATE ON client_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER channel_connections_updated_at
  BEFORE UPDATE ON channel_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Sync user to clients by yc_id (from GROWICE add_client_lifecycle.sql)
CREATE OR REPLACE FUNCTION public.sync_user_to_clients_by_yc_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_uid        UUID    := COALESCE(NEW.org_uid, '00000000-0000-0000-0000-000000000001'::uuid);
  v_channel        TEXT;
  v_priority       INTEGER;
  v_yc_id          TEXT;
  v_yclients_id    BIGINT;
  v_fullname       TEXT;
  v_name           TEXT;
  v_surname        TEXT;
  v_phone          TEXT;
  v_client_id      UUID;
  v_lifecycle      TEXT;
  v_telegram_user_id  BIGINT;
  v_whatsapp_user_id  TEXT;
  v_max_user_id       TEXT;
BEGIN
  v_yc_id       := NULLIF(BTRIM(COALESCE(NEW.yc_id, '')), '');
  v_yclients_id := NEW.yclients_id;

  IF v_yc_id IS NULL AND v_yclients_id IS NOT NULL THEN
    v_yc_id := v_yclients_id::text;
  END IF;

  -- lifecycle: 'client' если есть yc_id, иначе 'lead'
  v_lifecycle := CASE WHEN v_yc_id IS NOT NULL THEN 'client' ELSE 'lead' END;

  -- Имя и телефон
  v_name    := NULLIF(BTRIM(COALESCE(NEW.first_name, '')), '');
  v_surname := NULLIF(BTRIM(COALESCE(NEW.last_name, '')), '');
  v_fullname := NULLIF(BTRIM(COALESCE(NEW.client_fullname, '')), '');
  v_phone   := NULLIF(BTRIM(COALESCE(NEW.client_phone, '')), '');

  IF v_fullname IS NULL THEN
    v_fullname := NULLIF(CONCAT_WS(' ', v_name, v_surname), '');
  END IF;

  -- Для WhatsApp user_id обычно уже является номером телефона
  IF v_phone IS NULL AND TG_TABLE_NAME = 'whatsapp_users' THEN
    v_phone := NULLIF(BTRIM(COALESCE(NEW.user_id::text, '')), '');
  END IF;

  -- Без yc_id и без имени/телефона создавать лида не имеет смысла
  IF v_yc_id IS NULL AND v_fullname IS NULL AND v_phone IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_fullname IS NULL THEN
    v_fullname := COALESCE('Клиент ' || v_yc_id, 'Лид ' || COALESCE(v_phone, NEW.user_id::text));
  END IF;

  v_channel := CASE TG_TABLE_NAME
    WHEN 'telegram_users' THEN 'telegram'
    WHEN 'whatsapp_users' THEN 'whatsapp'
    WHEN 'max_users'      THEN 'max'
    ELSE NULL
  END;

  v_priority := CASE v_channel
    WHEN 'telegram'  THEN 1
    WHEN 'whatsapp'  THEN 2
    WHEN 'max'       THEN 3
    ELSE 99
  END;

  v_telegram_user_id := CASE WHEN TG_TABLE_NAME = 'telegram_users' THEN NEW.user_id::bigint ELSE NULL END;
  v_whatsapp_user_id := CASE WHEN TG_TABLE_NAME = 'whatsapp_users' THEN NEW.user_id::text   ELSE NULL END;
  v_max_user_id      := CASE WHEN TG_TABLE_NAME = 'max_users'      THEN NEW.user_id::text   ELSE NULL END;

  IF v_yc_id IS NOT NULL THEN
    -- Клиент с yc_id: upsert по (org_uid, yc_id)
    INSERT INTO public.clients (
      org_uid, yc_id, yclients_id, fullname, display_name, name, surname, phone,
      telegram_user_id, whatsapp_user_id, max_user_id,
      lifecycle_status, source_channel
    )
    VALUES (
      v_org_uid, v_yc_id, v_yclients_id, v_fullname, v_fullname, v_name, v_surname, v_phone,
      v_telegram_user_id, v_whatsapp_user_id, v_max_user_id,
      'client', v_channel
    )
    ON CONFLICT (org_uid, yc_id)
    DO UPDATE SET
      yclients_id       = COALESCE(EXCLUDED.yclients_id, public.clients.yclients_id),
      fullname          = COALESCE(NULLIF(public.clients.fullname, ''), EXCLUDED.fullname),
      display_name      = COALESCE(NULLIF(public.clients.display_name, ''), EXCLUDED.display_name),
      name              = COALESCE(NULLIF(public.clients.name, ''), EXCLUDED.name),
      surname           = COALESCE(NULLIF(public.clients.surname, ''), EXCLUDED.surname),
      phone             = COALESCE(NULLIF(public.clients.phone, ''), EXCLUDED.phone),
      telegram_user_id  = COALESCE(public.clients.telegram_user_id, EXCLUDED.telegram_user_id),
      whatsapp_user_id  = COALESCE(public.clients.whatsapp_user_id, EXCLUDED.whatsapp_user_id),
      max_user_id       = COALESCE(public.clients.max_user_id, EXCLUDED.max_user_id),
      lifecycle_status  = 'client'
    RETURNING id INTO v_client_id;

  ELSE
    -- Лид без yc_id: ищем по *_user_id + org_uid, чтобы не дублировать
    DECLARE
      v_uid_col TEXT := CASE TG_TABLE_NAME
        WHEN 'telegram_users' THEN 'telegram_user_id'
        WHEN 'whatsapp_users' THEN 'whatsapp_user_id'
        WHEN 'max_users'      THEN 'max_user_id'
      END;
    BEGIN
      EXECUTE format(
        'SELECT id FROM public.clients WHERE org_uid = $1 AND %I = $2 LIMIT 1',
        v_uid_col
      ) USING v_org_uid, NEW.user_id::text INTO v_client_id;

      IF v_client_id IS NULL THEN
        INSERT INTO public.clients (
          org_uid, fullname, display_name, name, surname, phone,
          telegram_user_id, whatsapp_user_id, max_user_id,
          lifecycle_status, source_channel
        )
        VALUES (
          v_org_uid, v_fullname, v_fullname, v_name, v_surname, v_phone,
          v_telegram_user_id, v_whatsapp_user_id, v_max_user_id,
          'lead', v_channel
        )
        RETURNING id INTO v_client_id;
      END IF;
    END;
  END IF;

  NEW.client_id := v_client_id;

  IF v_channel IS NOT NULL AND v_client_id IS NOT NULL THEN
    INSERT INTO public.client_channels (
      client_id, channel, channel_user_id, priority, is_active, can_notify, identified_via
    )
    VALUES (
      v_client_id, v_channel, NEW.user_id::text, v_priority,
      true, COALESCE(NEW.can_message, true), 'self_reported'
    )
    ON CONFLICT (client_id, channel)
    DO UPDATE SET
      channel_user_id = EXCLUDED.channel_user_id,
      is_active       = true,
      can_notify      = EXCLUDED.can_notify,
      updated_at      = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Apply sync trigger to all messenger user tables
CREATE TRIGGER tg_sync_user_to_clients
BEFORE INSERT OR UPDATE OF yc_id, yclients_id, client_fullname, client_phone, first_name, last_name, user_id
ON public.telegram_users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_clients_by_yc_id();

CREATE TRIGGER wa_sync_user_to_clients
BEFORE INSERT OR UPDATE OF yc_id, yclients_id, client_fullname, client_phone, first_name, last_name, user_id
ON public.whatsapp_users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_clients_by_yc_id();

CREATE TRIGGER max_sync_user_to_clients
BEFORE INSERT OR UPDATE OF yc_id, yclients_id, client_fullname, client_phone, first_name, last_name, user_id
ON public.max_users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_clients_by_yc_id();

-- 3. Promote lead to client when yc_id appears
CREATE OR REPLACE FUNCTION public.promote_lead_to_client()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.yc_id IS NULL OR OLD.yc_id = '') AND
     NEW.yc_id IS NOT NULL AND NEW.yc_id <> '' AND
     NEW.lifecycle_status = 'lead'
  THEN
    NEW.lifecycle_status := 'client';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_promote_lead
BEFORE UPDATE OF yc_id
ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.promote_lead_to_client();

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================

ALTER TABLE org_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_states             ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_ratings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_files           ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_day               ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_month             ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_channels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles             ENABLE ROW LEVEL SECURITY;

-- Platform tables — authenticated users have full access
CREATE POLICY "auth_all_org_settings"    ON org_settings    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_system_states"   ON system_states   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_map_ratings"     ON map_ratings     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_knowledge_files" ON knowledge_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_action_log"      ON action_log      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_metrics_day"     ON metrics_day     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_metrics_month"   ON metrics_month   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_webhooks"        ON webhooks        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_connections"     ON channel_connections       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_conn_events"     ON channel_connection_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agent tables — authenticated read
CREATE POLICY "auth_read_telegram_users"  ON telegram_users  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_whatsapp_users"  ON whatsapp_users  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_max_users"       ON max_users       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_clients"         ON clients         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_clients"        ON clients         FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_appointments"    ON appointments    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_appointments"   ON appointments    FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_client_channels" ON client_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_client_channels" ON client_channels FOR ALL   TO authenticated USING (true) WITH CHECK (true);

-- user_profiles — users can read/write own profile
CREATE POLICY "auth_own_profile" ON user_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_uid) WITH CHECK (auth.uid() = user_uid);

-- anon: only channel_connections SELECT (public status page)
CREATE POLICY "anon_read_connections" ON channel_connections FOR SELECT TO anon USING (true);

-- Also allow anon read/write for platform tables (MVP mode — no auth yet)
CREATE POLICY "anon_all_org_settings"    ON org_settings    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_system_states"   ON system_states   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_map_ratings"    ON map_ratings     FOR SELECT TO anon USING (true);
CREATE POLICY "anon_all_knowledge_files" ON knowledge_files FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_action_log"      ON action_log      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_metrics_day"     ON metrics_day     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_metrics_month"   ON metrics_month   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_webhooks"       ON webhooks        FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_conn_events"    ON channel_connection_events FOR SELECT TO anon USING (true);

-- anon read agent tables (n8n writes via service_role which bypasses RLS)
CREATE POLICY "anon_read_telegram_users"   ON telegram_users   FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_whatsapp_users"   ON whatsapp_users   FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_max_users"        ON max_users        FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_clients"          ON clients          FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_appointments"     ON appointments     FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_client_channels"  ON client_channels  FOR SELECT TO anon USING (true);

-- =============================================================================
-- SEED DATA (test org: 00000000-0000-0000-0000-000000000001)
-- =============================================================================

INSERT INTO org_settings (org_uid, salon_name, greeting_message)
VALUES ('00000000-0000-0000-0000-000000000001', 'Мой бизнес', 'Привет! Чем могу помочь?')
ON CONFLICT (org_uid) DO NOTHING;

INSERT INTO map_ratings (org_uid, source, rating, reviews_count) VALUES
  ('00000000-0000-0000-0000-000000000001', 'яндекс', 4.8, 127),
  ('00000000-0000-0000-0000-000000000001', '2гис',   4.9,  89)
ON CONFLICT (org_uid, source) DO NOTHING;

INSERT INTO system_states (org_uid, system_code, name, description, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'napominaniya',    'Напоминания',    'Поэтапное подтверждение записи (24ч, 12ч, 2ч, 1ч)', true),
  ('00000000-0000-0000-0000-000000000001', 'vozvrat_klienta', 'Возврат клиента','Авторассылка клиентам, не посещавшим более 50 дней', true),
  ('00000000-0000-0000-0000-000000000001', 'blagodarnost',    'Благодарность',  'Запрос отзыва и чаевых после визита',                true)
ON CONFLICT (org_uid, system_code) DO NOTHING;
