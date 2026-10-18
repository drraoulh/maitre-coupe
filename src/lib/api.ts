import type {
  Appointment, AppointmentStatus, BusySlot, Hairstyle, NewAppointment, Post, Profile, Service, Settings,
} from '../types'

/** Contrat commun entre le mode démo (navigateur) et le mode Supabase (vraie base). */
export interface Api {
  mode: 'demo' | 'supabase'

  // Comptes
  getCurrentUser(): Promise<Profile | null>
  signUp(input: { email: string; password: string; full_name: string; phone: string }): Promise<Profile | null>
  signIn(email: string, password: string): Promise<Profile>
  signOut(): Promise<void>
  updateProfile(patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>): Promise<Profile>
  onAuthChange(cb: () => void): () => void

  // Salon
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>

  // Prestations & tarifs
  listServices(): Promise<Service[]>
  saveService(service: Partial<Service> & { name: string }): Promise<Service>
  deleteService(id: string): Promise<void>

  // Galerie de coiffures
  listHairstyles(): Promise<Hairstyle[]>
  saveHairstyle(h: Partial<Hairstyle> & { title: string; image_url: string }): Promise<Hairstyle>
  deleteHairstyle(id: string): Promise<void>

  // Rendez-vous
  getBusySlots(date: string): Promise<BusySlot[]>
  createAppointment(input: NewAppointment): Promise<Appointment>
  listAppointments(): Promise<Appointment[]> // admin : tous ; client : les siens
  updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void>

  // Communauté
  listPosts(): Promise<Post[]>
  createPost(input: { content: string; image_url: string | null }): Promise<void>
  deletePost(id: string): Promise<void>
  toggleLike(postId: string): Promise<void>
  addComment(postId: string, content: string): Promise<void>
  deleteComment(id: string): Promise<void>

  // Images
  uploadImage(file: File): Promise<string>
}
