/**
 * Mode démo : toutes les données sont stockées dans le navigateur (localStorage).
 * Pratique pour tester sans serveur, mais chaque appareil a ses propres données.
 * Pour un vrai salon, configurez Supabase (voir README).
 */
import type { Api } from './api'
import type { Appointment, Comment, Hairstyle, Post, Profile, Service, Settings } from '../types'
import { DEFAULT_SETTINGS } from './seed'
import { blobToDataURL, compressImage, overlaps, uid } from './utils'

interface StoredUser extends Profile {
  password: string
}
interface StoredPost {
  id: string
  author_id: string
  content: string
  image_url: string | null
  created_at: string
}
interface StoredLike {
  post_id: string
  user_id: string
}
interface StoredComment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
}

export const DEMO_ADMIN = { email: 'admin@maitre-coupe.com', password: 'admin123' }
export const DEMO_PIN = '1234'

const KEY = 'mc_demo_v3_'

function read<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY + name)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(name: string, value: T) {
  try {
    localStorage.setItem(KEY + name, JSON.stringify(value))
  } catch {
    throw new Error("Espace de stockage du navigateur plein. Supprimez des images ou passez à Supabase.")
  }
}

function seedIfNeeded() {
  if (read('seeded', false)) return
  const now = Date.now()
  const adminId = uid()
  const users: StoredUser[] = [
    { id: adminId, email: DEMO_ADMIN.email, password: DEMO_ADMIN.password, full_name: 'Maître Coupe', phone: '', avatar_url: null, role: 'admin' },
  ]
  write('users', users)
  write('settings', DEFAULT_SETTINGS)
  // Catalogue et galerie vides : c'est l'admin qui publie les soins, modèles et prix.
  write('services', [] as Service[])
  write('hairstyles', [] as Hairstyle[])
  write('appointments', [] as Appointment[])
  write('posts', [
    {
      id: uid(),
      author_id: adminId,
      content: "Bienvenue dans la communauté Maître Coupe ! ✨ L’univers de la Beauté à Nkolmesseng, face à Guiko Center : coiffure, soins du visage, hammam, gommage, manucure, pédicure, massages, et coiffure à domicile. Partagez vos looks et vos avis !",
      image_url: null,
      created_at: new Date(now - 86400_000).toISOString(),
    },
  ] as StoredPost[])
  write('likes', [] as StoredLike[])
  write('comments', [] as StoredComment[])
  write('seeded', true)
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 80))

export function createDemoApi(): Api {
  seedIfNeeded()
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  const currentId = () => read<string | null>('session', null)
  const users = () => read<StoredUser[]>('users', [])
  const me = (): StoredUser | null => users().find((u) => u.id === currentId()) ?? null
  const strip = ({ password: _p, ...p }: StoredUser): Profile => p
  const requireUser = () => {
    const u = me()
    if (!u) throw new Error('Connectez-vous pour continuer.')
    return u
  }
  const requireAdmin = () => {
    const u = requireUser()
    if (u.role !== 'admin') throw new Error('Accès réservé à l’administrateur.')
    return u
  }
  const author = (id: string) => {
    const u = users().find((x) => x.id === id)
    return { id, full_name: u?.full_name ?? 'Utilisateur', avatar_url: u?.avatar_url ?? null, role: u?.role ?? 'client' as const }
  }

  // Même protection que Supabase : blocage après 10 codes faux.
  let failed = 0
  let lockedUntil = 0
  const checkPin = (pin: string) => {
    if (Date.now() < lockedUntil) throw new Error('Trop d’essais. Réessayez dans quelques minutes.')
    if (pin === read<string>('pin', DEMO_PIN)) {
      failed = 0
      return
    }
    failed += 1
    if (failed >= 10) {
      failed = 0
      lockedUntil = Date.now() + 15 * 60_000
    }
    throw new Error('Code incorrect.')
  }

  return {
    mode: 'demo',

    async getCurrentUser() {
      const u = me()
      return delay(u ? strip(u) : null)
    },
    async signUp({ email, password, full_name, phone }) {
      const all = users()
      const e = email.trim().toLowerCase()
      if (all.some((u) => u.email === e)) throw new Error('Un compte existe déjà avec cet e-mail.')
      if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.')
      const user: StoredUser = { id: uid(), email: e, password, full_name, phone, avatar_url: null, role: 'client' }
      write('users', [...all, user])
      write('session', user.id)
      emit()
      return strip(user)
    },
    async signIn(email, password) {
      const u = users().find((x) => x.email === email.trim().toLowerCase() && x.password === password)
      if (!u) throw new Error('E-mail ou mot de passe incorrect.')
      write('session', u.id)
      emit()
      return strip(u)
    },
    async signOut() {
      write('session', null)
      emit()
    },
    async updateProfile(patch) {
      const u = requireUser()
      const updated = { ...u, ...patch }
      write('users', users().map((x) => (x.id === u.id ? updated : x)))
      emit()
      return strip(updated)
    },
    onAuthChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },

    async getSettings() {
      return delay({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>('settings', {}) })
    },
    async saveSettings(s) {
      requireAdmin()
      write('settings', s)
    },

    async listServices() {
      return delay(read<Service[]>('services', []).sort((a, b) => a.position - b.position))
    },
    async saveService(input) {
      requireAdmin()
      const all = read<Service[]>('services', [])
      const existing = input.id ? all.find((s) => s.id === input.id) : undefined
      const svc: Service = {
        id: existing?.id ?? uid(),
        name: input.name,
        category: input.category ?? existing?.category ?? 'Autre',
        description: input.description ?? existing?.description ?? '',
        price: input.price ?? existing?.price ?? 0,
        duration: input.duration ?? existing?.duration ?? 30,
        image_url: input.image_url !== undefined ? input.image_url : existing?.image_url ?? null,
        active: input.active ?? existing?.active ?? true,
        position: input.position ?? existing?.position ?? all.length + 1,
      }
      write('services', existing ? all.map((s) => (s.id === svc.id ? svc : s)) : [...all, svc])
      return svc
    },
    async deleteService(id) {
      requireAdmin()
      write('services', read<Service[]>('services', []).filter((s) => s.id !== id))
    },

    async listHairstyles() {
      return delay(read<Hairstyle[]>('hairstyles', []).sort((a, b) => b.created_at.localeCompare(a.created_at)))
    },
    async saveHairstyle(input) {
      requireAdmin()
      const all = read<Hairstyle[]>('hairstyles', [])
      const existing = input.id ? all.find((h) => h.id === input.id) : undefined
      const h: Hairstyle = {
        id: existing?.id ?? uid(),
        title: input.title,
        description: input.description ?? existing?.description ?? '',
        image_url: input.image_url,
        price_from: input.price_from !== undefined ? input.price_from : existing?.price_from ?? null,
        category: input.category ?? existing?.category ?? 'Autre',
        created_at: existing?.created_at ?? new Date().toISOString(),
      }
      write('hairstyles', existing ? all.map((x) => (x.id === h.id ? h : x)) : [h, ...all])
      return h
    },
    async deleteHairstyle(id) {
      requireAdmin()
      write('hairstyles', read<Hairstyle[]>('hairstyles', []).filter((h) => h.id !== id))
    },

    async getBusySlots(date) {
      return delay(
        read<Appointment[]>('appointments', [])
          .filter((a) => a.date === date && a.status !== 'cancelled')
          .map((a) => ({ time: a.time, duration: a.duration })),
      )
    },
    async createAppointment(input) {
      // Même règle que la base Supabase : pas plus de rendez-vous simultanés que de postes (sauf pour l'admin).
      const all = read<Appointment[]>('appointments', [])
      const cap = Math.max(1, read<Partial<Settings>>('settings', {}).capacity ?? DEFAULT_SETTINGS.capacity)
      const taken = all.filter((a) => a.date === input.date && a.status !== 'cancelled' && overlaps(a.time, a.duration, input.time, input.duration)).length
      if (me()?.role !== 'admin' && taken >= cap) throw new Error('Ce créneau vient d’être réservé. Choisissez un autre horaire.')
      const appt: Appointment = {
        ...input,
        id: uid(),
        user_id: currentId(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }
      write('appointments', [...all, appt])
      return appt
    },
    async listAppointments() {
      const u = requireUser()
      const all = read<Appointment[]>('appointments', [])
      return delay(u.role === 'admin' ? all : all.filter((a) => a.user_id === u.id))
    },
    async updateAppointmentStatus(id, status) {
      const u = requireUser()
      const all = read<Appointment[]>('appointments', [])
      const a = all.find((x) => x.id === id)
      if (!a) throw new Error('Rendez-vous introuvable.')
      if (u.role !== 'admin' && (a.user_id !== u.id || status !== 'cancelled')) throw new Error('Action non autorisée.')
      write('appointments', all.map((x) => (x.id === id ? { ...x, status } : x)))
    },

    async updateAppointment(id, patch) {
      requireAdmin()
      const all = read<Appointment[]>('appointments', [])
      if (!all.some((x) => x.id === id)) throw new Error('Rendez-vous introuvable.')
      write('appointments', all.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    async getAppointmentWithPin(id, pin) {
      checkPin(pin)
      const a = read<Appointment[]>('appointments', []).find((x) => x.id === id)
      if (!a) throw new Error('Rendez-vous introuvable.')
      return delay(a)
    },
    async setStatusWithPin(id, pin, status) {
      checkPin(pin)
      const all = read<Appointment[]>('appointments', [])
      const a = all.find((x) => x.id === id)
      if (!a) throw new Error('Rendez-vous introuvable.')
      const updated = { ...a, status }
      write('appointments', all.map((x) => (x.id === id ? updated : x)))
      return updated
    },
    async setValidationPin(pin) {
      requireAdmin()
      if (pin.length < 4) throw new Error('Le code doit contenir au moins 4 caractères.')
      write('pin', pin)
    },
    async hasValidationPin() {
      requireAdmin()
      return !!read<string>('pin', DEMO_PIN)
    },

    async listPosts() {
      const myId = currentId()
      const likes = read<StoredLike[]>('likes', [])
      const comments = read<StoredComment[]>('comments', [])
      const posts = read<StoredPost[]>('posts', []).sort((a, b) => b.created_at.localeCompare(a.created_at))
      return delay(
        posts.map<Post>((p) => ({
          id: p.id,
          content: p.content,
          image_url: p.image_url,
          created_at: p.created_at,
          author: author(p.author_id),
          like_count: likes.filter((l) => l.post_id === p.id).length,
          liked_by_me: !!myId && likes.some((l) => l.post_id === p.id && l.user_id === myId),
          comments: comments
            .filter((c) => c.post_id === p.id)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map<Comment>((c) => ({ id: c.id, post_id: c.post_id, content: c.content, created_at: c.created_at, author: author(c.author_id) })),
        })),
      )
    },
    async createPost({ content, image_url }) {
      const u = requireUser()
      write('posts', [
        ...read<StoredPost[]>('posts', []),
        { id: uid(), author_id: u.id, content, image_url, created_at: new Date().toISOString() },
      ])
    },
    async deletePost(id) {
      const u = requireUser()
      const all = read<StoredPost[]>('posts', [])
      const p = all.find((x) => x.id === id)
      if (!p || (p.author_id !== u.id && u.role !== 'admin')) throw new Error('Action non autorisée.')
      write('posts', all.filter((x) => x.id !== id))
      write('comments', read<StoredComment[]>('comments', []).filter((c) => c.post_id !== id))
      write('likes', read<StoredLike[]>('likes', []).filter((l) => l.post_id !== id))
    },
    async toggleLike(postId) {
      const u = requireUser()
      const likes = read<StoredLike[]>('likes', [])
      const has = likes.some((l) => l.post_id === postId && l.user_id === u.id)
      write('likes', has ? likes.filter((l) => !(l.post_id === postId && l.user_id === u.id)) : [...likes, { post_id: postId, user_id: u.id }])
    },
    async addComment(postId, content) {
      const u = requireUser()
      write('comments', [
        ...read<StoredComment[]>('comments', []),
        { id: uid(), post_id: postId, author_id: u.id, content, created_at: new Date().toISOString() },
      ])
    },
    async deleteComment(id) {
      const u = requireUser()
      const all = read<StoredComment[]>('comments', [])
      const c = all.find((x) => x.id === id)
      if (!c || (c.author_id !== u.id && u.role !== 'admin')) throw new Error('Action non autorisée.')
      write('comments', all.filter((x) => x.id !== id))
    },

    async uploadImage(file) {
      requireUser()
      // Image plus petite en mode démo pour ne pas saturer le stockage du navigateur.
      return blobToDataURL(await compressImage(file, 800, 0.7))
    },
  }
}
