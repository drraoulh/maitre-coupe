# Maître Coupe — Cahier des charges (à valider)

> Ce document décrit **ce que l'application doit faire** avant de la développer.
> Les points marqués ❓ sont des décisions à prendre ensemble.

---

## 1. Vision

Une application web (ouverte sur téléphone comme une appli) pour le salon **Maître Coupe** qui :

1. **Attire des clients** : vitrine du salon, tarifs, photos des coiffures.
2. **Remplit l'agenda** : réservation en ligne 24h/24, sans appel.
3. **Fidélise** : une communauté type réseau social où les clients partagent leurs looks.
4. **Simplifie la gestion** : un espace administrateur pour tout piloter depuis un téléphone.

---

## 2. Les utilisateurs (rôles)

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **Visiteur** | Toute personne sur le site | Voir le salon, les tarifs, la galerie, lire la communauté, **réserver sans compte** |
| **Client** | Visiteur inscrit (e-mail + mot de passe) | + suivre/annuler ses rendez-vous, publier, aimer, commenter, gérer son profil |
| **Administrateur** | Le gérant du salon | + gérer les rendez-vous, les prix, la galerie, modérer la communauté, régler le salon |
| ❓ **Coiffeur** | Employés du salon | Voir uniquement *son* planning — **à décider (version 2 ?)** |

---

## 3. Plan du site

### Partie publique
| Page | Adresse | Contenu |
|---|---|---|
| Accueil | `/` | Bannière, ouvert/fermé maintenant, prestations phares, dernières coiffures, aperçu communauté, horaires, itinéraire, WhatsApp |
| Tarifs | `/prestations` | Toutes les prestations par catégorie (Homme, Femme, Enfant, Beauté…) avec prix et durée |
| Coiffures | `/galerie` | Galerie photo des réalisations, filtre par catégorie, bouton « Je veux cette coiffure » |
| Réserver | `/reserver` | 3 étapes : prestation → date & créneau libre → nom & téléphone. Confirmation + envoi WhatsApp au salon |
| Communauté | `/communaute` | Fil d'actualité : publications avec photo, j'aime, commentaires |
| Connexion | `/connexion` | Connexion / inscription |
| Mon espace | `/mon-espace` | Mes rendez-vous (à venir / historique), mon profil et ma photo |

### Espace administrateur (`/admin`)
| Section | Contenu |
|---|---|
| Tableau de bord | RDV du jour, demandes à confirmer, chiffre d'affaires semaine / mois, graphique 7 jours, prestations les plus demandées |
| Rendez-vous | Liste par jour, filtres (aujourd'hui, à venir, passés, statut), recherche, **confirmer / terminer / annuler**, contacter le client par WhatsApp ou appel, ajouter un RDV pris par téléphone |
| Prestations & prix | Ajouter, modifier, masquer, supprimer une prestation (nom, catégorie, prix, durée, photo) |
| Coiffures | Publier des photos de réalisations (titre, catégorie, prix « à partir de ») |
| Communauté | Publier au nom du salon (promos, nouveautés), supprimer des publications/commentaires |
| Paramètres | Nom, slogan, présentation, photo de couverture, adresse, téléphone, WhatsApp, réseaux sociaux, devise, horaires par jour, nombre de postes |

---

## 4. Règles métier

**Rendez-vous**
- Statuts : `En attente` → `Confirmé` → `Terminé` (ou `Annulé`).
- Les créneaux proposés tiennent compte : des horaires du jour, de la durée de la prestation, des RDV déjà pris et du **nombre de postes** (ex. 2 coiffeurs = 2 clients en même temps).
- Réservation possible jusqu'à 30 jours à l'avance, pas dans le passé.
- Un client peut annuler son propre rendez-vous ; seul l'admin confirme.

**Communauté**
- Il faut un compte pour publier, aimer ou commenter ; la lecture est libre.
- Chacun peut supprimer ses propres contenus ; l'admin peut tout supprimer.
- Les publications du salon portent un badge « Salon ».

**Prix** : affichés dans la devise choisie (par défaut **FCFA**).

---

## 5. Données (modèle)

```
profils        (id, email, nom, téléphone, photo, rôle client/admin)
parametres     (une seule ligne : infos du salon + horaires)
prestations    (id, nom, catégorie, description, prix, durée, photo, visible, ordre)
coiffures      (id, titre, description, photo, prix_à_partir_de, catégorie, date)
rendez_vous    (id, client?, prestation, nom, téléphone, date, heure, durée, prix, note, statut)
publications   (id, auteur, texte, photo, date)
likes          (publication, utilisateur)
commentaires   (id, publication, auteur, texte, date)
```

---

## 6. Choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Interface | **React + Vite + TypeScript** | Rapide, moderne, fonctionne très bien sur mobile |
| Hébergement | **Netlify** (déjà en place : maitre-coupe.netlify.app) | Gratuit, déploiement automatique à chaque modification |
| Base de données, comptes, photos | **Supabase** (gratuit pour démarrer) | Base partagée entre tous les appareils, sécurité par rôle |
| Notifications | **Liens WhatsApp** pré-remplis | Pas de coût, canal le plus utilisé par les clients |
| Mode démo | Données dans le navigateur | Pour tester l'appli avant de configurer Supabase |

Organisation du code :
```
src/
  pages/        pages publiques (Accueil, Tarifs, Galerie, Réserver, Communauté…)
  admin/        pages de l'espace administrateur
  components/   éléments réutilisables (menu, cartes, fenêtres, publication…)
  context/      utilisateur connecté, paramètres du salon
  lib/          accès aux données (Supabase ou démo), calcul des créneaux, utilitaires
supabase/       script de création de la base + règles de sécurité
docs/           ce cahier des charges
```

---

## 7. Découpage en versions

**Version 1 (MVP)** — tout ce qui est décrit aux sections 3 et 4.

**Version 2 (idées)**
- Comptes coiffeurs et choix du coiffeur à la réservation
- Rappel automatique la veille (SMS / WhatsApp Business)
- Paiement d'acompte (Mobile Money : MTN / Airtel)
- Programme de fidélité (ex. 10e coupe offerte)
- Avis clients avec étoiles
- Boutique de produits
- Installation sur l'écran d'accueil (PWA) et notifications

---

## 8. Questions à valider ❓

1. **Pays / devise** : FCFA (Congo-Brazzaville ?) — ou autre ?
2. **Coiffeurs** : faut-il choisir son coiffeur dès la version 1 ?
3. **Réservation sans compte** autorisée (plus simple pour le client) — d'accord ?
4. **Communauté** : publications des clients visibles tout de suite, ou validées d'abord par l'admin ?
5. **Paiement en ligne** (Mobile Money) : version 1 ou plus tard ?
6. **Identité visuelle** : noir & or (luxe) — ou des couleurs/logo existants à reprendre ?
7. Infos réelles du salon : adresse, téléphone, WhatsApp, horaires, liste des prestations et prix.
