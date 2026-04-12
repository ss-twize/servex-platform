# SERVEX Platform — MVP Design Spec
**Дата:** 2026-04-12  
**Статус:** Согласовано  

---

## 1. Контекст и цель

SERVEX Platform — компактный owner-dashboard для сервисного бизнеса. MVP должен за 15–30 секунд отвечать на вопросы: что происходит, даёт ли ИИ-агент результат, есть ли проблемы. Это не CRM и не дублирование YClients — это витрина данных и центр управления автоматизациями.

SERVEX — тот же продукт, что GROWICE (beauty-салоны), но MVP: новое репо, новая БД, те же n8n воркфлоу.

**Основной пользователь:** владелец/управляющий бизнеса (полный доступ).  
**Вторичный:** администратор (ограниченный доступ — в MVP архитектурно заложен, но не реализован отдельно).

---

## 2. Стек и инфраструктура

| Компонент | Решение |
|---|---|
| Фреймворк | Next.js 14 App Router + TypeScript |
| Стили | Tailwind CSS (тёмная тема GROWICE: bg `#0A0D14`, акцент `#00FF00`) |
| Шрифты | Unbounded (заголовки) + Montserrat (текст), Google Fonts |
| БД / Auth | Supabase (новый проект: `qjqwmsusxuekkzmuiyqc`) |
| Графики | Recharts |
| Иконки | Lucide React |
| CRM-бэкенд | YClients (org_id: 1647948) |
| Автоматизации | n8n воркфлоу (те же паттерны, что в GROWICE) |
| Деплой | GitHub → Vercel (автодеплой) |

**Репо:** `ss-twize/servex-platform`  
**Supabase URL:** `https://qjqwmsusxuekkzmuiyqc.supabase.co`

---

## 3. Архитектура данных (гибрид)

```
YClients API
    ↓ n8n воркфлоу (синхронизация по расписанию)
Supabase PostgreSQL ←→ Platform UI (React hooks)
    ↑
YClients API (через Next.js API routes — live-статусы)
```

- **n8n → Supabase:** записи, клиенты, метрики — синхронизируются в фоне
- **API routes → YClients:** live-статусы подтверждений, real-time данные
- **UI → Supabase:** настройки, база знаний, автосистемы, действия

---

## 4. База данных

### Группа A: Агентские таблицы (n8n пишет, UI читает)

**`telegram_users`**
```sql
id, org_uid, user_id (BIGINT UNIQUE), yc_id, yclients_id,
client_fullname, client_phone, first_name, last_name, tg_username,
blocked, allow_marketing, can_message, last_message, created_at,
client_id → clients.id
```

**`whatsapp_users`** — идентично, user_id TEXT

**`max_users`** — идентично, user_id TEXT

**`clients`** — полная схема сразу (без инкрементальных миграций):
```sql
id, org_uid, fullname, phone, gender
yc_id (TEXT), yclients_id (BIGINT)          -- связь с YClients
telegram_user_id, whatsapp_user_id, max_user_id
lifecycle_status: lead | client | inactive   -- триггер-продвижение
source_channel: telegram | whatsapp | max | yclients | manual
name, surname, patronymic, display_name, email
birth_date, comment, discount
visits, spent, paid, balance, avg_check, ltv
first_visit, last_visit, last_message
importance, importance_id, categories (JSONB), custom_fields (JSONB)
sms_check, sms_bot, sms_not, can_message
sex, sex_id, age
cancel_count, no_show_count
source, city, branch, master
services (JSONB), favorite_service, channel
tags (JSONB), notes
wa_check_status, communication_activity
has_bonuses, has_subscription, has_deposit
reacted_to_offers
raw_payload (JSONB)
created_at, updated_at, last_change_date
UNIQUE (org_uid, yc_id)
```

**`appointments`**:
```sql
id, org_uid
client_id → clients.id, yc_id, client_name, phone, contact
status, service_name, service_id, master_id, master_name
date (TIMESTAMPTZ), duration_min, price, comment
record_id (TEXT UNIQUE), record_hash (TEXT UNIQUE)
reminder_1h, reminder_2h, reminder_12h, reminder_8am, reminder_24h (BOOLEAN)
created_at
```

**`client_channels`**:
```sql
id, client_id → clients.id
channel: telegram | whatsapp | max | phone
channel_user_id, priority, is_active, can_notify
identified_via, last_used, created_at, updated_at
UNIQUE (client_id, channel)
```

### Группа B: Подключения каналов

**`channel_connections`** — GREEN-API инстансы (WhatsApp/Max):
```sql
id, org_uid, channel_code, provider, status
display_name, external_account_id
instance_id, api_url, api_token, webhook_url  -- server-only
last_checked_at, connected_at, disconnected_at
error_code, error_message, meta (JSONB)
UNIQUE (org_uid, channel_code)
```

**`channel_connection_events`** — лог событий подключения

### Группа C: Платформенные таблицы

**`org_settings`**:
```sql
org_uid (UNIQUE), salon_name, contacts_import_source
greeting_message, work_start, work_end
active_threshold_days (30), at_risk_threshold_days (50), inactive_threshold_days (90)
timezone, currency, address, phone, map_url
created_at, updated_at
```

**`system_states`**: `org_uid, system_code, name, description, enabled, updated_at`  
MVP системы: `napominaniya`, `vozvrat_klienta`, `blagodarnost`

**`map_ratings`**: `org_uid, source (яндекс|2гис), rating, reviews_count, updated_at`

**`knowledge_files`**: `org_uid, name, file_type, storage_url, drive_url, status, created_at`

**`action_log`**: `org_uid, action_code, params (JSONB), status, error_message, created_at`

**`metrics_day`**: `org_uid, date (UNIQUE), unique_contacts, incoming_messages, outgoing_messages, appointments, revenue, no_shows, new_clients`

**`metrics_month`**: аналогично + `avg_check`

**`webhooks`**: `org_uid, action_code (UNIQUE), url, enabled, description`

### Группа D: Auth (новое в SERVEX)

**Supabase Auth** — встроенный `auth.users`

**`user_profiles`**:
```sql
id, user_uid → auth.users.id, org_uid
role: владелец | администратор
display_name, created_at
```

### Триггеры

- `sync_user_to_clients_by_yc_id` — при INSERT/UPDATE в tg/wa/max_users → upsert в clients, создание записи в client_channels
- `promote_lead_to_client` — при появлении yc_id у clients → lifecycle_status = 'client'
- `update_client_channels_ts` — обновление updated_at

### RLS стратегия

| Таблица | anon | authenticated | service_role |
|---|---|---|---|
| Агентские (tg/wa/max_users, clients, appointments) | — | SELECT | ALL |
| client_channels | — | SELECT | ALL |
| channel_connections | SELECT (публичный статус) | SELECT | ALL |
| Платформенные (org_settings и др.) | — | ALL (своя org_uid) | ALL |
| user_profiles | — | SELECT (свой uid) | ALL |

---

## 5. Файловая структура

```
/app
  /login                        ← вход (Supabase Auth)
  /(dashboard)                  ← layout-группа с Sidebar + Header
    /page.tsx                   ← Главная
    /appointments/page.tsx      ← Записи
    /clients/page.tsx           ← Клиенты
    /settings/page.tsx          ← Настройка
  /api
    /yclients/appointments/     ← прокси live-данных
    /yclients/clients/
    /auth/callback/             ← Supabase Auth redirect

/middleware.ts                  ← защита /(dashboard) роутов

/lib
  supabase.ts                   ← browser-клиент + server-клиент
  yclients.ts                   ← YClients API (server-only)
  webhooks.ts                   ← callWebhook(code, params)
  auth.ts                       ← хелперы авторизации
  hooks/
    useDashboardStats.ts
    useAppointments.ts
    useClients.ts
    useSystemStates.ts
    useOrgSettings.ts
    useActionLog.ts

/components
  layout/
    Sidebar.tsx                 ← 4 пункта: Главная, Записи, Клиенты, Настройка
    Header.tsx                  ← фильтр периода + профиль
  ui/
    MetricCard.tsx
    EmptyState.tsx
    Table.tsx                   ← универсальная с сортировкой
    FilterBar.tsx
    StatusBadge.tsx
    Toggle.tsx
  charts/
    RevenueChart.tsx
    AppointmentFunnel.tsx
    TimeHeatmap.tsx
  dashboard/
    MetricsRow.tsx
    ActivityFeed.tsx
    AttentionBlock.tsx
  clients/
    SegmentTabs.tsx
    BulkActionBar.tsx
  settings/
    tabs/
      SalonTab.tsx
      IntegrationsTab.tsx
      SegmentationTab.tsx
      AgentTab.tsx
      SystemsTab.tsx
      KnowledgeTab.tsx
```

---

## 6. Страницы

### Главная (`/`)
- **Фильтр периода** (глобальный): Сегодня / 7 дней / 30 дней / Этот месяц / Произвольный
- **Верхние карточки (8):** Выручка, Записей, Новых клиентов, Конверсия, Средний чек, Неявки, Возвращённых, Сэкономлено
- **Главный график:** LineChart с переключением метрики (выручка / записи / клиенты)
- **Быстрый обзор:** Ждут подтверждения, Отмены, Под риском оттока, Записи вне рабочего времени, Скорость ответа
- **Лента событий:** action_log (новая запись, отмена, возврат, ошибка интеграции...)
- **Требует внимания:** X клиентов под риском, Y ждут подтверждения, статус интеграций

**Источники:** `metrics_day`, `action_log`, `clients` (under_risk count), live YClients (pending count)

### Записи (`/appointments`)
- **Карточки:** Всего, Подтверждено, Ждут, Отменено, Неявки
- **Воронка:** Обращение → Запись → Подтверждение → Визит → Оплата
- **Тепловая карта:** загрузка по часам/дням
- **Фильтры:** период, статус, мастер, источник, создано агентом
- **Таблица:** Дата | Клиент | Услуга | Мастер | Статус | Источник | Кто создал

**Источники:** `appointments` (Supabase) + `/api/yclients/appointments` (live статусы)

### Клиенты (`/clients`)
- **Карточки сегментов:** Всего, Новые, Активные, Под риском, Неактивные
- **Быстрые сегменты (табы/чипсы):** Все / Новые / Активные / Под риском / Потерянные / VIP / Можно писать / Нельзя писать
- **Фильтры:** период визита, статус, мастер, источник, согласие, выручка (диапазон), визиты (диапазон)
- **Таблица:** Имя | Телефон | Статус | Последний визит | Дней без визита | Визитов | Выручка | Средний чек | Мастер | Канал | Согласие
- **Массовые действия:** выбрать сегмент → запустить сценарий (возврат / рассылка) через callWebhook()

**Статусы клиентов** (вычисляются по порогам из `org_settings`):
- `new` — меньше X дней с первого визита
- `active` — последний визит ≤ active_threshold_days
- `at_risk` — последний визит > active_threshold_days, ≤ at_risk_threshold_days
- `lost` — последний визит > inactive_threshold_days
- `vip` — по выручке или количеству визитов (настраивается)

### Настройка (`/settings`)
Шесть вкладок:
1. **Салон** — название, timezone, валюта, адрес, телефон, ссылка на карты
2. **Интеграции** — YClients / Telegram / WhatsApp + статус / дата синхронизации / кнопка переподключить
3. **Сегментация** — пороги дней (at_risk, inactive, vip-условия)
4. **Агент** — приветственное сообщение, активные каналы, поведение
5. **Автосистемы** — 3 системы MVP: Напоминания / Возврат клиента / Благодарность (toggle + описание + статус)
6. **База знаний** — загрузка файлов, текстовый ввод

---

## 7. Ключевые правила UI

- Весь интерфейс на **русском языке** (нет AI, CRM, KPI, ID, OK, VIP в UI)
- При отсутствии данных — **корректное пустое состояние** (не фиктивные проценты)
- Никаких процентов роста без базы сравнения
- Единый фильтр периода на всех аналитических страницах
- Приоритет — **десктоп**, планшет желателен, мобильный упрощённый

---

## 8. Вне MVP

Не реализовывать: отдельные разделы Аналитика / Финансы / Персонал, биллинг, ролевая система UI, маркетинговый конструктор, расширенная отчётность, авто-сдвиг, допродажа, аналитика отмен.

---

## 9. Критерии готовности MVP

- [ ] 4 страницы работают без ошибок
- [ ] Supabase Auth (вход/выход) работает
- [ ] Данные из Supabase отображаются корректно
- [ ] Пустые состояния везде корректны (нет фейковых цифр)
- [ ] Настройки сохраняются
- [ ] Автосистемы включаются/выключаются через callWebhook()
- [ ] База знаний: загрузка файлов работает
- [ ] SQL-миграция применена в новом Supabase-проекте
