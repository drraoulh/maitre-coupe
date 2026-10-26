import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Api } from './api'
import type { Appointment, Author, Hairstyle, Post, Profile, Service, Settings } from '../types'
import { DEFAULT_SETTINGS } from './seed'
import { compressImage, uid } from './utils'

function check<R extends { data: unknown; error: unknown }>(res: R): R['data'] {
  if (res.error) throw new Error(translate((res.error as { message?: string }).message ?? 'Erreur inconnue'))
  return res.data
}

function translate(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou mot de passe incorrect.'
  if (/already registered/i.test(msg)) return 'Un compte existe déjà avec cet e-mail.'
  if (/email not confirmed/i.test(msg)) return 'Confirmez votre e-mail (lien reçu par mail) avant de vous connecter.'
  if (/password should be at least/i.test(msg)) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (/row-level security/i.test(msg)) return 'Action non autorisée.'
  return msg
}

type AuthorRow = { id: string; full_name: string; avatar_url: string | null; role: 'client' | 'admin' } | null
const toAuthor = (a: AuthorRow, id: string): Author =>
  a ?? { id, full_name: 'Utilisateur', avatar_url: null, role: 'client' }

export function createSupabaseApi(url: string, key: string): Api {
  const sb: SupabaseClient = createClient(url, key)

  const userId = async () => (await sb.auth.getSession()).data.session?.user.id ?? null
  const requireUserId = async () => {
    const id = await userId()
    if (!id) throw new Error('Connectez-vous pour continuer.')
    return id
  }
  const loadProfile = async (id: string): Promise<Profile | null> => {
    const { data } = await sb.from('profiles').select('*').eq('id', id).maybeSingle()
    return (data as Profile) ?? null
  }

  return {
    mode: 'supabase',

    async getCurrentUser() {
      const id = await userId()
      return id ? loadProfile(id) : null
    },
    async signUp({ email, password, full_name, phone }) {
      const data = check(
        await sb.auth.signUp({ email: email.trim(), password, options: { data: { full_name, phone } } }),
      )
      // Si la confirmation par e-mail est activée, il n'y a pas encore de session.
      if (!data.session || !data.user) return null
      return loadProfile(data.user.id)
    },
    async signIn(email, password) {
      const data = check(await sb.auth.signInWithPassword({ email: email.trim(), password }))
      if (!data.user) throw new Error('Connexion impossible.')
      const p = await loadProfile(data.user.id)
      if (!p) throw new Error('Profil introuvable. Le script supabase/schema.sql a-t-il été exécuté ?')
      return p
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async updateProfile(patch) {
      const id = await requireUserId()
      return check(await sb.from('profiles').update(patch).eq('id', id).select().single()) as Profile
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') cb()
      })
      return () => data.subscription.unsubscribe()
    },

    async getSettings() {
      const { data } = await sb.from('settings').select('data').eq('id', 1).maybeSingle()
      return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<Settings>) ?? {}) }
    },
    async saveSettings(s) {
      check(await sb.from('settings').upsert({ id: 1, data: s, updated_at: new Date().toISOString() }))
    },

    async listServices() {
      return check(await sb.from('services').select('*').order('position').order('name')) as Service[]
    },
    async saveService(s) {
      const { id, ...rest } = s
      if (id) return check(await sb.from('services').update(rest).eq('id', id).select().single()) as Service
      return check(await sb.from('services').insert(rest).select().single()) as Service
    },
    async deleteService(id) {
      check(await sb.from('services').delete().eq('id', id))
    },

    async listHairstyles() {
      return check(await sb.from('hairstyles').select('*').order('created_at', { ascending: false })) as Hairstyle[]
    },
    async saveHairstyle(h) {
      const { id, created_at: _c, ...rest } = h
      if (id) return check(await sb.from('hairstyles').update(rest).eq('id', id).select().single()) as Hairstyle
      return check(await sb.from('hairstyles').insert(rest).select().single()) as Hairstyle
    },
    async deleteHairstyle(id) {
      check(await sb.from('hairstyles').delete().eq('id', id))
    },

    async getBusySlots(date) {
      const rows = check(await sb.rpc('busy_slots', { d: date })) as { slot_time: string; slot_duration: number }[]
      return rows.map((r) => ({ time: r.slot_time, duration: r.slot_duration }))
    },
    async createAppointment(input) {
      // Identifiant généré ici : un visiteur sans compte n'a pas le droit de relire la ligne insérée.
      const row = { ...input, id: uid(), user_id: await userId(), status: 'pending' as const }
      check(await sb.from('appointments').insert(row))
      return { ...row, created_at: new Date().toISOString() }
    },
    async listAppointments() {
      await requireUserId()
      return check(
        await sb.from('appointments').select('*').order('date', { ascending: false }).order('time'),
      ) as Appointment[]
    },
    async updateAppointmentStatus(id, status) {
      check(await sb.from('appointments').update({ status }).eq('id', id))
    },

    async getAppointmentWithPin(id, pin) {
      const r = check(await sb.rpc('appointment_for_validation', { appt_id: id, p: pin })) as { error?: string; appointment?: Appointment }
      if (r.error || !r.appointment) throw new Error(r.error ?? 'Rendez-vous introuvable.')
      return r.appointment
    },
    async setStatusWithPin(id, pin, status) {
      const r = check(await sb.rpc('validate_appointment', { appt_id: id, p: pin, new_status: status })) as { error?: string; appointment?: Appointment }
      if (r.error || !r.appointment) throw new Error(r.error ?? 'Action impossible.')
      return r.appointment
    },
    async setValidationPin(pin) {
      check(await sb.rpc('set_validation_pin', { p: pin }))
    },
    async hasValidationPin() {
      return !!check(await sb.rpc('has_validation_pin'))
    },

    async listPosts() {
      const me = await userId()
      const rows = check(
        await sb
          .from('posts')
          .select(
            'id, content, image_url, created_at, author_id, author:profiles!posts_author_id_fkey(id, full_name, avatar_url, role), post_likes(user_id), comments(id, post_id, content, created_at, author_id, author:profiles!comments_author_id_fkey(id, full_name, avatar_url, role))',
          )
          .order('created_at', { ascending: false })
          .limit(100),
      ) as unknown as Array<{
        id: string
        content: string
        image_url: string | null
        created_at: string
        author_id: string
        author: AuthorRow
        post_likes: { user_id: string }[]
        comments: { id: string; post_id: string; content: string; created_at: string; author_id: string; author: AuthorRow }[]
      }>
      return rows.map<Post>((p) => ({
        id: p.id,
        content: p.content,
        image_url: p.image_url,
        created_at: p.created_at,
        author: toAuthor(p.author, p.author_id),
        like_count: p.post_likes.length,
        liked_by_me: !!me && p.post_likes.some((l) => l.user_id === me),
        comments: [...p.comments]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((c) => ({ id: c.id, post_id: c.post_id, content: c.content, created_at: c.created_at, author: toAuthor(c.author, c.author_id) })),
      }))
    },
    async createPost({ content, image_url }) {
      const id = await requireUserId()
      check(await sb.from('posts').insert({ author_id: id, content, image_url }))
    },
    async deletePost(id) {
      check(await sb.from('posts').delete().eq('id', id))
    },
    async toggleLike(postId) {
      const me = await requireUserId()
      const existing = check(
        await sb.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', me).maybeSingle(),
      )
      if (existing) check(await sb.from('post_likes').delete().eq('post_id', postId).eq('user_id', me))
      else check(await sb.from('post_likes').insert({ post_id: postId, user_id: me }))
    },
    async addComment(postId, content) {
      const me = await requireUserId()
      check(await sb.from('comments').insert({ post_id: postId, author_id: me, content }))
    },
    async deleteComment(id) {
      check(await sb.from('comments').delete().eq('id', id))
    },

    async uploadImage(file) {
      const me = await requireUserId()
      const blob = await compressImage(file)
      const path = `${me}/${uid()}.jpg`
      check(await sb.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', upsert: false }))
      return sb.storage.from('images').getPublicUrl(path).data.publicUrl
    },
  }
}
