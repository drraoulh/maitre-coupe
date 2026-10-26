-- Paramètres réels du salon (facultatif : l'admin peut aussi tout régler depuis /admin/parametres).
-- Le catalogue des soins, les modèles et les prix sont publiés par l'admin depuis le site.
update public.settings set data = '{
  "name": "Maître Coupe",
  "tagline": "Coiffure · Beauté · Bien-être",
  "address": "Nkolmesseng, face à Guiko Center",
  "city": "Yaoundé",
  "phone": "+237 657 75 58 68",
  "whatsapp": "237657755868",
  "currency": "FCFA",
  "google_url": "https://g.page/maitre-coupe",
  "google_rating": 4.6,
  "google_reviews": 25
}'::jsonb where id = 1;
