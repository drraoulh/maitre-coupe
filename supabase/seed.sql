-- Prestations de départ (facultatif). À lancer une seule fois après schema.sql.
insert into public.services (name, category, description, price, duration, position) values
  ('Coupe homme classique', 'Homme', 'Coupe aux ciseaux ou à la tondeuse, finitions et coiffage.', 3000, 30, 1),
  ('Dégradé (fade)', 'Homme', 'Dégradé bas, moyen ou haut, contours nets au rasoir.', 4000, 45, 2),
  ('Taille de barbe', 'Homme', 'Taille, contours et serviette chaude.', 2000, 20, 3),
  ('Coupe enfant', 'Enfant', 'Pour les moins de 12 ans.', 2000, 30, 4),
  ('Tresses africaines', 'Femme', 'Box braids, cornrows ou nattes collées. Mèches non incluses.', 15000, 180, 5),
  ('Brushing', 'Femme', 'Shampoing, soin démêlant et brushing.', 5000, 45, 6),
  ('Défrisage + soin', 'Femme', 'Défrisage, soin protecteur et mise en forme.', 10000, 90, 7),
  ('Pose de perruque', 'Femme', 'Installation, personnalisation et coiffage.', 8000, 60, 8),
  ('Manucure', 'Beauté', 'Soin des mains et pose de vernis.', 5000, 45, 9),
  ('Maquillage', 'Beauté', 'Maquillage jour, soirée ou mariage.', 10000, 60, 10);
