# Maître Coupe — site & application

Salon de coiffure · Institut de beauté · Bien-être — Nkolmesseng (face à Guiko Center), Yaoundé.

Le cahier des charges complet est dans [`docs/CAHIER_DES_CHARGES.md`](docs/CAHIER_DES_CHARGES.md).

## Ce que fait l'application

- **Vitrine** : accueil (ouvert/fermé, WhatsApp, itinéraire, note Google), 6 univers de soins, tarifs, galerie.
- **Réservation sans compte** : choix du soin, créneaux libres calculés automatiquement, message WhatsApp au salon.
- **Communauté** : fil type réseau social (photos, j'aime, commentaires, partage WhatsApp/Facebook).
- **Espace administrateur** (`/admin`) : rendez-vous, soins & prix, modèles (galerie, avec option « publier aussi dans la communauté »), publications, paramètres (logo, horaires, contacts…).

## Lancer en local

```bash
npm install
npm run dev
```

Sans configuration, l'application tourne en **mode démo** : les données restent dans le navigateur.
Compte administrateur de démo : `admin@maitre-coupe.com` / `admin123`.

## Passer à la vraie base de données (Supabase, gratuit)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez `supabase/schema.sql`, puis (facultatif) `supabase/seed.sql`.
3. Copiez `.env.example` en `.env` et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   (Supabase › Project Settings › API).
4. Créez votre compte sur le site, puis dans **SQL Editor** :
   ```sql
   update public.profiles set role = 'admin' where email = 'votre@email.com';
   ```

## Mise en ligne (Netlify)

Le fichier `netlify.toml` est prêt. Dans Netlify › Site settings › Environment variables, ajoutez
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis redéployez.

## Organisation du code

```
src/pages/       pages publiques
src/admin/       espace administrateur
src/components/  éléments réutilisables (menu, logo, publication, fenêtres…)
src/context/     utilisateur connecté, paramètres du salon
src/lib/         données (démo ou Supabase), univers, créneaux, utilitaires
supabase/        schéma SQL + règles de sécurité
```
