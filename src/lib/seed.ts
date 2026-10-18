import type { Hairstyle, Service, Settings } from '../types'

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`

export const DEFAULT_SETTINGS: Settings = {
  name: 'Maître Coupe',
  tagline: "L'art de la coiffure, au service de votre style",
  about:
    "Maître Coupe est un salon de coiffure et de beauté pour hommes, femmes et enfants. Coupes, tresses, soins, barbe, maquillage et onglerie : notre équipe prend soin de vous dans un cadre chaleureux, avec des produits de qualité.",
  address: 'Avenue principale',
  city: 'Brazzaville',
  phone: '+242 06 000 00 00',
  whatsapp: '242060000000',
  email: 'contact@maitre-coupe.com',
  instagram: '',
  facebook: '',
  tiktok: '',
  currency: 'FCFA',
  slot_step: 30,
  capacity: 2,
  hero_image: u('photo-1503951914875-452162b0f3f1'),
  hours: [
    { open: '10:00', close: '16:00', closed: true }, // dimanche
    { open: '09:00', close: '19:00', closed: false },
    { open: '09:00', close: '19:00', closed: false },
    { open: '09:00', close: '19:00', closed: false },
    { open: '09:00', close: '19:00', closed: false },
    { open: '09:00', close: '20:00', closed: false },
    { open: '08:00', close: '20:00', closed: false }, // samedi
  ],
}

export const SEED_SERVICES: Omit<Service, 'id'>[] = [
  { name: 'Coupe homme classique', category: 'Homme', description: 'Coupe aux ciseaux ou à la tondeuse, finitions et coiffage.', price: 3000, duration: 30, image_url: u('photo-1621605815971-fbc98d665033'), active: true, position: 1 },
  { name: 'Dégradé (fade)', category: 'Homme', description: 'Dégradé bas, moyen ou haut, contours nets au rasoir.', price: 4000, duration: 45, image_url: u('photo-1599351431202-1e0f0137899a'), active: true, position: 2 },
  { name: 'Taille de barbe', category: 'Homme', description: 'Taille, contours et serviette chaude.', price: 2000, duration: 20, image_url: u('photo-1585747860715-2ba37e788b70'), active: true, position: 3 },
  { name: 'Coupe enfant', category: 'Enfant', description: 'Pour les moins de 12 ans.', price: 2000, duration: 30, image_url: null, active: true, position: 4 },
  { name: 'Tresses africaines', category: 'Femme', description: 'Box braids, cornrows ou nattes collées. Mèches non incluses.', price: 15000, duration: 180, image_url: u('photo-1580618672591-eb180b1a973f'), active: true, position: 5 },
  { name: 'Brushing', category: 'Femme', description: 'Shampoing, soin démêlant et brushing.', price: 5000, duration: 45, image_url: u('photo-1560066984-138dadb4c035'), active: true, position: 6 },
  { name: 'Défrisage + soin', category: 'Femme', description: 'Défrisage, soin protecteur et mise en forme.', price: 10000, duration: 90, image_url: null, active: true, position: 7 },
  { name: 'Pose de perruque', category: 'Femme', description: 'Installation, personnalisation et coiffage.', price: 8000, duration: 60, image_url: null, active: true, position: 8 },
  { name: 'Manucure', category: 'Beauté', description: 'Soin des mains et pose de vernis.', price: 5000, duration: 45, image_url: null, active: true, position: 9 },
  { name: 'Maquillage', category: 'Beauté', description: 'Maquillage jour, soirée ou mariage.', price: 10000, duration: 60, image_url: u('photo-1522337360788-8b13dee7a37e'), active: true, position: 10 },
]

export const SEED_HAIRSTYLES: Omit<Hairstyle, 'id' | 'created_at'>[] = [
  { title: 'Dégradé américain', description: 'Dégradé haut avec dessin au rasoir.', image_url: u('photo-1599351431202-1e0f0137899a'), price_from: 4000, category: 'Homme' },
  { title: 'Barbe sculptée', description: 'Contours nets et barbe dégradée.', image_url: u('photo-1585747860715-2ba37e788b70'), price_from: 2000, category: 'Homme' },
  { title: 'Box braids', description: 'Tresses longues, mèches au choix.', image_url: u('photo-1580618672591-eb180b1a973f'), price_from: 15000, category: 'Femme' },
  { title: 'Coupe classique', description: 'Coupe courte, propre et intemporelle.', image_url: u('photo-1621605815971-fbc98d665033'), price_from: 3000, category: 'Homme' },
  { title: 'Brushing lisse', description: 'Brillance et volume.', image_url: u('photo-1560066984-138dadb4c035'), price_from: 5000, category: 'Femme' },
  { title: 'Mise en beauté', description: 'Coiffure et maquillage pour vos événements.', image_url: u('photo-1522337360788-8b13dee7a37e'), price_from: 10000, category: 'Beauté' },
]
