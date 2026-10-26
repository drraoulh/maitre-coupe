import type { Settings } from '../types'

/** Infos réelles du salon (carte de visite + recherches d'octobre 2026, horaires « version A »). */
export const DEFAULT_SETTINGS: Settings = {
  name: 'Maître Coupe',
  tagline: 'L’univers de la Beauté',
  about:
    "Salon de coiffure mixte, institut de beauté et espace bien-être à Nkolmesseng. Coiffure hommes et femmes, soins du visage, hammam, gommage corporel, manucure, pédicure et massages. Nous nous déplaçons aussi à domicile, proposons des formations et vendons des produits et accessoires de beauté.",
  address: 'Nkolmesseng, face à Guiko Center',
  city: 'Yaoundé',
  phone: '+237 657 75 58 68',
  phone2: '+237 653 22 90 36',
  whatsapp: '237657755868',
  email: 'maitrecoupe@gmail.com',
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
  salon_photo: '/images/salle-soins.webp',
  owner_photo: '/images/fondateur.webp',
  owner_name: '',
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
