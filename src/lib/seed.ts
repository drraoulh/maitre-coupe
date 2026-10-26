import type { Settings } from '../types'

/** Infos réelles du salon (recherches d'octobre 2026, horaires « version A »). */
export const DEFAULT_SETTINGS: Settings = {
  name: 'Maître Coupe',
  tagline: 'Coiffure · Beauté · Bien-être',
  about:
    "Salon de coiffure mixte, institut de beauté et espace bien-être à Nkolmesseng. Coiffure hommes et femmes, soins du visage, hammam, gommage corporel, manucure, pédicure et massages : venez prendre soin de vous dans un cadre chaleureux.",
  address: 'Nkolmesseng, face à Guiko Center',
  city: 'Yaoundé',
  phone: '+237 657 75 58 68',
  whatsapp: '237657755868',
  email: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  currency: 'FCFA',
  slot_step: 30,
  capacity: 2,
  hero_image: '',
  logo_url: '',
  google_url: 'https://g.page/maitre-coupe',
  google_rating: 4.6,
  google_reviews: 25,
  hours: [
    { open: '12:00', close: '21:30', closed: false }, // dimanche
    { open: '07:00', close: '21:00', closed: false }, // lundi
    { open: '07:00', close: '21:00', closed: false },
    { open: '07:00', close: '21:00', closed: false },
    { open: '07:00', close: '21:00', closed: false },
    { open: '07:00', close: '21:00', closed: false },
    { open: '07:00', close: '21:00', closed: false }, // samedi
  ],
}
