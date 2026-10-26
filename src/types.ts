export type Role = 'client' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url: string | null
  role: Role
}

export interface DayHours {
  open: string // "09:00"
  close: string // "19:00"
  closed: boolean
}

export interface Settings {
  name: string
  tagline: string
  about: string
  address: string
  city: string
  phone: string
  phone2: string // second numéro (facultatif)
  whatsapp: string // numéro international sans "+" ni espaces, ex. 242061234567
  email: string
  instagram: string
  facebook: string
  tiktok: string
  currency: string
  slot_step: number // minutes entre deux créneaux
  capacity: number // nombre de clients pris en charge en même temps
  hero_image: string // photo de couverture (vide = fond noir & or)
  logo_url: string // logo envoyé par l'admin (vide = logo par défaut)
  google_url: string // fiche Google du salon
  google_rating: number // note affichée (ex. 4.6)
  google_reviews: number // nombre d'avis
  salon_photo: string // photo réelle du salon (section « Le salon »)
  owner_photo: string // photo du gérant
  owner_name: string // nom du gérant (facultatif)
  hours: DayHours[] // index 0 = dimanche … 6 = samedi
}

export interface Service {
  id: string
  name: string
  category: string
  description: string
  price: number
  duration: number // minutes
  image_url: string | null
  active: boolean
  position: number
}

export interface Hairstyle {
  id: string
  title: string
  description: string
  image_url: string
  price_from: number | null
  category: string
  created_at: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  user_id: string | null
  service_id: string | null
  service_name: string
  price: number
  duration: number
  client_name: string
  client_phone: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  note: string
  status: AppointmentStatus
  created_at: string
}

export interface NewAppointment {
  service_id: string
  service_name: string
  price: number
  duration: number
  client_name: string
  client_phone: string
  date: string
  time: string
  note: string
}

export interface BusySlot {
  time: string
  duration: number
}

export interface Author {
  id: string
  full_name: string
  avatar_url: string | null
  role: Role
}

export interface Comment {
  id: string
  post_id: string
  content: string
  created_at: string
  author: Author
}

export interface Post {
  id: string
  content: string
  image_url: string | null
  created_at: string
  author: Author
  like_count: number
  liked_by_me: boolean
  comments: Comment[]
}
