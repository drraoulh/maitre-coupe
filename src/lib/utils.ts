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
