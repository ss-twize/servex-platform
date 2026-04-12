export const DEFAULT_ORG_UID = '00000000-0000-0000-0000-000000000001'

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  active: 'Активный',
  at_risk: 'Под риском',
  lost: 'Потерянный',
  vip: 'VIP',
  lead: 'Лид',
  inactive: 'Неактивный',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Подтверждена',
  not_confirmed: 'Ожидает',
  cancelled: 'Отменена',
  visited: 'Завершена',
  no_show: 'Неявка',
}
