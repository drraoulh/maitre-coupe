import type { BusySlot, DayHours, Settings } from '../types'

export const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  done: 'Terminé',
  cancelled: 'Annulé',
} as const

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat('fr-FR').format(value)} ${currency}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/** Date locale au format YYYY-MM-DD (sans décalage UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  return parseISODate(s).toLocaleDateString('fr-FR', opts)
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(n: number): string {
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

export function hoursFor(settings: Settings, date: string): DayHours {
  return settings.hours[parseISODate(date).getDay()]
}

/**
 * Créneaux libres pour une prestation d'une durée donnée.
 * Un créneau est libre si le salon est ouvert sur toute la durée,
 * s'il n'est pas déjà passé, et si moins de `capacity` rendez-vous se chevauchent.
 */
export function availableSlots(settings: Settings, date: string, duration: number, busy: BusySlot[]): string[] {
  const day = hoursFor(settings, date)
  if (day.closed) return []
  const open = toMinutes(day.open)
  const close = toMinutes(day.close)
  const step = Math.max(10, settings.slot_step || 30)
  const capacity = Math.max(1, settings.capacity || 1)

  const now = new Date()
  const isToday = toISODate(now) === date
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const slots: string[] = []
  for (let start = open; start + duration <= close; start += step) {
    if (isToday && start <= nowMin + 15) continue
    const end = start + duration
    const overlapping = busy.filter((b) => {
      const bs = toMinutes(b.time)
      const be = bs + b.duration
      return bs < end && start < be
    }).length
    if (overlapping < capacity) slots.push(fromMinutes(start))
  }
  return slots
}

export function whatsappLink(number: string, message: string): string {
  const clean = number.replace(/[^\d]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?'
}

/** Redimensionne et compresse une image avant envoi (max 1200 px, JPEG). */
export async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Image illisible'))
      i.src = url
    })
    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression impossible'))), 'image/jpeg', quality),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Une erreur est survenue'
}

/**
 * Numéro camerounais : accepte « 657755868 », « 6 57 75 58 68 », « +237 657… », « 00237… ».
 * Renvoie « +237 657 75 58 68 », ou null si le numéro n'est pas valide.
 */
export function normalizeCameroonPhone(input: string): string | null {
  let d = input.replace(/[^\d]/g, '')
  if (d.startsWith('00237')) d = d.slice(5)
  else if (d.startsWith('237') && d.length === 12) d = d.slice(3)
  if (!/^[26]\d{8}$/.test(d)) return null
  return `+237 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

/** Référence courte et lisible d'un rendez-vous (ex. « MC-4F7A2C »). */
export function bookingRef(id: string): string {
  return `MC-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`
}

/** Moment de la journée d'un créneau. */
export function dayPart(time: string): 'Matin' | 'Après-midi' | 'Soir' {
  const m = toMinutes(time)
  if (m < 12 * 60) return 'Matin'
  if (m < 17 * 60) return 'Après-midi'
  return 'Soir'
}

/** Fichier agenda (.ics) pour ajouter le rendez-vous au calendrier du téléphone. */
export function calendarFile(opts: { title: string; date: string; time: string; duration: number; location: string; description: string }): string {
  const [y, mo, d] = opts.date.split('-')
  const start = `${y}${mo}${d}T${opts.time.replace(':', '')}00`
  const endMin = toMinutes(opts.time) + opts.duration
  const end = `${y}${mo}${d}T${fromMinutes(Math.min(endMin, 23 * 60 + 59)).replace(':', '')}00`
  const esc = (t: string) => t.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maitre Coupe//Reservation//FR',
    'BEGIN:VEVENT',
    `UID:${start}-${Math.random().toString(36).slice(2)}@maitre-coupe`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=Africa/Douala:${start}`,
    `DTEND;TZID=Africa/Douala:${end}`,
    `SUMMARY:${esc(opts.title)}`,
    `LOCATION:${esc(opts.location)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(opts.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

/** Deux créneaux se chevauchent-ils ? */
export function overlaps(aTime: string, aDur: number, bTime: string, bDur: number): boolean {
  const a = toMinutes(aTime)
  const b = toMinutes(bTime)
  return a < b + bDur && b < a + aDur
}

/** Message WhatsApp envoyé au salon à la réservation : tous les détails + lien de validation pour l'admin. */
export function salonBookingMessage(
  a: { id: string; service_name: string; date: string; time: string; duration: number; price: number; client_name: string; client_phone: string; note: string },
  opts: { salonName: string; currency: string; origin: string },
): string {
  const code = bookingRef(a.id)
  const lines = [
    `Bonjour ${opts.salonName} 👋, nouvelle réservation depuis le site :`,
    '',
    `🔑 Code : ${code}`,
    `💇 Soin : ${a.service_name}`,
    `📅 Date : ${formatDate(a.date)} à ${a.time} (${formatDuration(a.duration)})`,
    `💰 Prix : ${a.price > 0 ? formatPrice(a.price, opts.currency) : 'sur devis'}`,
    `👤 Nom : ${a.client_name}`,
    `📞 Tél : ${a.client_phone}`,
  ]
  if (a.note) lines.push(`📝 ${a.note}`)
  lines.push('', `✅ Pour le salon — valider avec le code du salon : ${opts.origin}/valider/${a.id}`)
  return lines.join('\n')
}

/** Décale une date ISO de n jours. */
export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Télécharge un tableau en CSV (séparateur « ; », lisible directement dans Excel en français). */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    const t = String(v ?? '')
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const csv = '\ufeff' + rows.map((r) => r.map(cell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Clé de regroupement d'un client : son numéro sans espaces ni indicatif. */
export function phoneKey(phone: string): string {
  const d = phone.replace(/[^\d]/g, '')
  return d.startsWith('237') && d.length === 12 ? d.slice(3) : d
}
