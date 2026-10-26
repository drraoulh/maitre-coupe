# Maître Coupe — Cahier des charges (v2, à valider)

> Ce document décrit **ce que l'application doit faire** avant de la développer.
> ✅ = confirmé · ❓ = à confirmer par le salon · ⚠️ = point d'attention

---

## 0. Positionnement

**Maître Coupe n'est pas « un simple salon de coiffure » :**

> **Maître Coupe — Salon de coiffure · Institut de beauté · Bien-être**
> Nkolmesseng, Yaoundé — face à Guiko Center

C'est ce que dit le salon lui-même sur Facebook :
« Pour tous vos soins du visage, hammam, gommage corporel, pédicure manucure, coiffure mixte, massage etc. »

Le site doit donc donner l'image d'un **espace de soin et de détente complet**, haut de gamme (noir & or),
où l'on vient pour une coupe **et** pour se faire chouchouter.

**Concurrence directe à Yaoundé (même positionnement « coiffure + spa ») :** Spectra, Celka Beauty and Spa (Nlongkak),
Beautés du Monde (Bastos), Majestic Spa, Relooker Boys/Girls. Quasi tous sont dans les quartiers centraux :
**Maître Coupe peut être *la* référence beauté & bien-être de Nkolmesseng / Yaoundé V.**

---

## 1. Fiche d'identité (recherches du 26/10/2026)

| Information | Valeur | Source | Statut |
|---|---|---|---|
| Nom commercial | Maître Coupe / Maître-Coupe | Facebook, annuaires | ✅ |
| Activité | Coiffure mixte, esthétique, bien-être | Facebook, AfricaBizInfo | ✅ |
| Adresse | Nkolmesseng, **face à Guiko Center**, Yaoundé (Yaoundé V) | Facebook | ✅ |
| Téléphone | **+237 657 75 58 68** | Facebook, AfricaBizInfo, Pages Jaunes, Go Africa Online, Cybo | ✅ |
| WhatsApp (prise de RDV) | Lien existant : `wa.me/message/LSCNTSUAUE4CP1` | AfricaBizInfo | ❓ à tester |
| Fiche Google | `g.page/maitre-coupe` — **4,6/5 sur 25 avis** | AfricaBizInfo (avis repris de Google) | ✅ existe |
| Page Facebook officielle | facebook.com/901322259739304 | beautynailhairsalons | ❓ (une 2e page existe : 102573512366310) |
| Ouverture | 2021 · entreprise dirigée par une femme | AfricaBizInfo | ❓ |
| Équipements | Wi-Fi, toilettes, parking, accessible, adapté aux enfants · paiement espèces / sans contact | AfricaBizInfo | ❓ |
| Tarifs | Non publiés | — | ❓ à fournir |
| E-mail / site officiel | Aucun trouvé | — | ⚠️ |
| Logo | Existant | Gérant | ⏳ en attente |

### ⚠️ Horaires : deux versions différentes en ligne

| Jour | Version A (Google / AfricaBizInfo) | Version B (Facebook / beautynailhairsalons) |
|---|---|---|
| Lundi | 07:00 – 21:00 | 11:00 – 21:00 |
| Mardi → Samedi | 07:00 – 21:00 | 09:30 – 21:00 |
| Dimanche | 12:00 – 21:30 | 11:00 – 21:00 |

➡️ **Le salon doit confirmer les vrais horaires**, puis on les corrige aussi sur Google et Facebook (sinon les clients se déplacent pour rien).

---

## 2. Catalogue de prestations (base confirmée)

Six univers, tirés de la présentation publique du salon. **Aucun prix, durée ni soin spécialisé ne sera publié sans validation du salon.**

| Univers | Ce qu'on sait | À préciser par le salon |
|---|---|---|
| 💇 **Coiffure mixte** | Hommes et femmes | Coupes, dégradés, barbe, tresses, défrisage, perruques… prix et durées |
| ✨ **Soins du visage** | Soins esthétiques | Types de soins, prix, durées |
| 🧖 **Hammam** | Détente | Formule seule / avec gommage, durée, prix |
| 🌿 **Gommage corporel** | Exfoliation, soins du corps | Produits (savon noir, café, sucre…), prix |
| 💅 **Manucure & pédicure** | Mains et pieds | Vernis simple / semi-permanent, prix |
| 💆 **Massages** | Bien-être | Types (relaxant, dos…), durées, prix |

**Idée forte : les formules / forfaits**, très courants chez les concurrents (ex. « Hammam + gommage + pédicure »).
Exemples à valider : *Rituel détente* (hammam + gommage + massage), *Beauté complète* (coiffure + manucure + pédicure), *Spécial mariée*.

> Les photos d'illustration seront marquées « Images d'inspiration » tant qu'on n'a pas de vraies photos du salon.

---

## 3. Les utilisateurs (rôles)

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **Visiteur** | Toute personne | Voir le salon, les soins, les prix, la galerie, lire la communauté, **réserver sans compte** ✅ |
| **Client** | Visiteur inscrit | + suivre/annuler ses RDV, publier, aimer, commenter, profil |
| **Administrateur** | La gérante / le gérant | + gérer RDV, catalogue, prix, galerie, communauté, paramètres |
| ❓ **Praticien** | Coiffeur·se, esthéticienne, masseur·se | Voir *son* planning — version 2 ? |

---

## 4. Plan du site

### Partie publique
| Page | Adresse | Contenu |
|---|---|---|
| Accueil | `/` | Bannière « Coiffure · Beauté · Bien-être », ouvert/fermé maintenant, les 6 univers, formules, note **4,6★ Google**, réalisations, communauté, horaires, itinéraire « face Guiko Center », WhatsApp |
| Nos soins & tarifs | `/prestations` | Catalogue par univers (Coiffure, Visage, Hammam, Gommage, Mains & pieds, Massages) + formules |
| Galerie | `/galerie` | Réalisations (coiffures, ongles, ambiance du salon), filtre par univers |
| Réserver | `/reserver` | 3 étapes : soin → date & créneau → nom & téléphone. Confirmation + message WhatsApp au salon |
| Communauté | `/communaute` | Fil type réseau social : photos, j'aime, commentaires, publications du salon (promos) |
| Le salon | `/salon` | Histoire, équipe, équipements (Wi-Fi, parking…), carte, horaires, avis Google |
| Connexion / Mon espace | `/connexion`, `/mon-espace` | Compte client, mes RDV, mon profil |

### Espace administrateur (`/admin`)
| Section | Contenu |
|---|---|
| Tableau de bord | RDV du jour, demandes à confirmer, chiffre d'affaires semaine/mois, soins les plus demandés |
| Rendez-vous | Par jour, filtres, confirmer / terminer / annuler, WhatsApp ou appel au client, ajout d'un RDV pris par téléphone |
| Soins & tarifs | Ajouter / modifier / masquer un soin ou une formule (univers, prix, durée, photo) |
| Galerie | Publier des photos de réalisations |
| Communauté | Publier au nom du salon, modérer |
| Paramètres | Nom, slogan, adresse, téléphone, WhatsApp, réseaux, horaires par jour, nombre de postes / cabines |

---

## 5. Règles métier

**Rendez-vous**
- Statuts : `En attente` → `Confirmé` → `Terminé` (ou `Annulé`).
- Créneaux calculés selon : horaires du jour, durée du soin, RDV existants, **nombre de postes**.
- ❓ Faut-il distinguer les ressources (ex. 2 fauteuils coiffure + 1 cabine hammam + 1 table de massage) ? → simple en V1 (un nombre global), détaillé en V2.
- Réservation jusqu'à 30 jours à l'avance ; le client peut annuler ; l'admin confirme.

**Communauté** : compte obligatoire pour publier/aimer/commenter ; chacun supprime ses contenus ; l'admin modère tout ; badge « Salon » sur les publications officielles.

**Format** : prix en **FCFA** (« 5 000 FCFA ») ; téléphones **+237 6XX XX XX XX**.

**Honnêteté** : pas de prix, de soin ou de promesse de résultat publiés sans validation du salon ; images d'illustration signalées comme telles.

---

## 6. Données (modèle)

```
profils        (id, email, nom, téléphone, photo, rôle)
parametres     (infos du salon + horaires + nombre de postes)
univers        (Coiffure, Visage, Hammam, Gommage, Mains & pieds, Massages)
prestations    (id, univers, nom, description, prix, durée, photo, visible, est_une_formule, ordre)
galerie        (id, titre, univers, photo, prix_à_partir_de, date)
rendez_vous    (id, client?, prestation, nom, téléphone, date, heure, durée, prix, note, statut)
publications / likes / commentaires
```

---

## 7. Choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Interface | React + Vite + TypeScript | Rapide et fluide sur téléphone |
| Hébergement | Netlify (maitre-coupe.netlify.app) | Déjà en place, gratuit |
| Base de données, comptes, photos | Supabase | Données partagées, sécurité par rôle |
| Notifications | Liens WhatsApp pré-remplis | Canal n°1 des clients, gratuit |
| Visibilité | SEO local (« institut de beauté Nkolmesseng », « hammam Yaoundé »…), aperçu soigné au partage WhatsApp, lien vers la fiche Google | Capter les recherches locales |
| Mobile | Installable (PWA), images compressées | Connexions lentes, usage 100 % mobile |

---

## 8. Plan de réalisation

| Étape | Contenu | Résultat testable |
|---|---|---|
| **1. Fondations** | Identité noir & or + logo, menu, pied de page, mobile, mode démo | Naviguer sur téléphone |
| **2. Vitrine** | Accueil, Nos soins & tarifs (6 univers + formules), Galerie, Le salon | Montrer le site aux clients |
| **3. Réservation** | Sans compte, créneaux libres, WhatsApp au salon | Prendre un vrai RDV |
| **4. Admin** | Tableau de bord, RDV, soins & prix, galerie, paramètres | Gérer le salon depuis le téléphone |
| **5. Communauté** | Comptes, fil photos, j'aime, commentaires, modération | Inviter les premiers clients |
| **6. Mise en ligne** | Supabase réel, déploiement Netlify, SEO | Site officiel en ligne |
| **7. Visibilité** (hors code) | Corriger horaires Google & Facebook, fusionner/clarifier les 2 pages Facebook, ajouter le lien du site partout, demander des avis Google aux clients satisfaits | Plus de clients via Google |

**Version 2 (idées)** : choix du praticien, ressources par cabine, rappels automatiques, acompte **MTN MoMo / Orange Money**, carte de fidélité, cartes cadeaux (fort potentiel pour un institut), boutique de produits.

---

## 9. Décisions

**Validé ✅** : FCFA / Cameroun · réservation sans compte · noir & or + logo existant · positionnement coiffure + beauté + bien-être.

**À fournir / confirmer par le salon ❓**
1. **Horaires réels** (version A ou B, ou autres).
2. **Liste des soins avec prix et durées** pour les 6 univers, et les formules éventuelles.
3. Le lien WhatsApp `wa.me/message/LSCNTSUAUE4CP1` fonctionne-t-il ? Quelle page Facebook est l'officielle ?
4. **Équipe** : combien de postes / cabines peuvent travailler en même temps ?
5. Communauté : publications clients visibles tout de suite ou validées par l'admin ?
6. **Logo** (PNG transparent ou SVG) et **vraies photos** du salon et des réalisations.

---

### Sources
- Facebook du salon via beautynailhairsalons.com : https://www.beautynailhairsalons.com/CM/Yaound%C3%A9/901322259739304/Ma%C3%AEtre-Coupe
- AfricaBizInfo : https://www.africabizinfo.com/fr-CM/maitre-coupe-6-57-75-58-68
- Pages Jaunes Yaoundé : https://www.pagesjaunes.online/yaound%C3%A9/salons-de-coiffure
- Concurrence : https://setalmaa.com/instituts-beaute-et-bien-etre-notre-selection-despaces-pour-se-faire-chouchouter/ · https://www.beautynailhairsalons.com/CM/Yaound%C3%A9/38748-3
