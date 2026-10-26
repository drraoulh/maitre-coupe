-- =====================================================================
--  Maître Coupe — schéma Supabase
--  À coller dans Supabase > SQL Editor > New query, puis "Run".
--  Le script peut être relancé sans risque.
-- =====================================================================

-- ---------- Profils (un par compte) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crée le profil automatiquement à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empêche un client de se donner le rôle admin lui-même
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est vide dans l'éditeur SQL de Supabase : la promotion manuelle reste possible.
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

alter table public.profiles enable row level security;
drop policy if exists "profiles lisibles" on public.profiles;
create policy "profiles lisibles" on public.profiles for select using (true);
drop policy if exists "profil modifiable par son propriétaire" on public.profiles;
create policy "profil modifiable par son propriétaire" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- ---------- Paramètres du salon (une seule ligne) ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

alter table public.settings enable row level security;
drop policy if exists "paramètres publics" on public.settings;
create policy "paramètres publics" on public.settings for select using (true);
drop policy if exists "paramètres admin" on public.settings;
create policy "paramètres admin" on public.settings for update using (public.is_admin());

-- ---------- Prestations & tarifs ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Autre',
  description text not null default '',
  price integer not null default 0,
  duration integer not null default 30,
  image_url text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
drop policy if exists "prestations publiques" on public.services;
create policy "prestations publiques" on public.services for select using (true);
drop policy if exists "prestations admin" on public.services;
create policy "prestations admin" on public.services for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Galerie de coiffures ----------
create table if not exists public.hairstyles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null,
  price_from integer,
  category text not null default 'Autre',
  created_at timestamptz not null default now()
);

alter table public.hairstyles enable row level security;
drop policy if exists "galerie publique" on public.hairstyles;
create policy "galerie publique" on public.hairstyles for select using (true);
drop policy if exists "galerie admin" on public.hairstyles;
create policy "galerie admin" on public.hairstyles for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Rendez-vous ----------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price integer not null default 0,
  duration integer not null default 30,
  client_name text not null,
  client_phone text not null,
  date date not null,
  time text not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists appointments_date_idx on public.appointments(date);

alter table public.appointments enable row level security;
-- Tout le monde peut réserver (même sans compte), uniquement au statut "en attente"
drop policy if exists "réserver" on public.appointments;
create policy "réserver" on public.appointments for insert
  with check (status = 'pending' and (user_id is null or user_id = auth.uid()));
drop policy if exists "voir ses rendez-vous" on public.appointments;
create policy "voir ses rendez-vous" on public.appointments for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin gère les rendez-vous" on public.appointments;
create policy "admin gère les rendez-vous" on public.appointments for update
  using (public.is_admin());
drop policy if exists "client annule son rendez-vous" on public.appointments;
create policy "client annule son rendez-vous" on public.appointments for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'cancelled');

-- Refuse un rendez-vous si le créneau est complet (nombre de postes atteint) ou dans le passé.
-- L'admin peut toujours ajouter un rendez-vous (client venu sur place, par exemple).
create or replace function public.check_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cap int;
  n int;
begin
  if public.is_admin() or new.status = 'cancelled' then
    return new;
  end if;
  if new.date < (now() at time zone 'Africa/Douala')::date then
    raise exception 'Cette date est déjà passée.';
  end if;
  -- Évite que deux clients prennent le dernier créneau au même instant
  perform pg_advisory_xact_lock(hashtext('rdv-' || new.date::text));
  select greatest(coalesce((data->>'capacity')::int, 1), 1) into cap from public.settings where id = 1;
  select count(*) into n from public.appointments a
  where a.date = new.date and a.status <> 'cancelled' and a.id <> new.id
    and a.time::time < new.time::time + make_interval(mins => new.duration)
    and new.time::time < a.time::time + make_interval(mins => a.duration);
  if n >= coalesce(cap, 1) then
    raise exception 'Ce créneau vient d''être réservé. Choisissez un autre horaire.';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_check_capacity on public.appointments;
create trigger appointments_check_capacity before insert on public.appointments
  for each row execute function public.check_capacity();

-- Créneaux occupés d'une journée (sans exposer les noms des clients)
drop function if exists public.busy_slots(date);
create or replace function public.busy_slots(d date)
returns table (slot_time text, slot_duration integer)
language sql stable security definer set search_path = public as $$
  select a.time, a.duration from public.appointments a
  where a.date = d and a.status <> 'cancelled';
$$;
grant execute on function public.busy_slots(date) to anon, authenticated;

-- ---------- Code de validation du salon ----------
-- Le personnel valide les réservations depuis le lien WhatsApp avec un code secret,
-- sans compte. Le code est stocké chiffré dans une table illisible depuis le site.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.salon_secrets (
  id int primary key default 1 check (id = 1),
  pin_hash text,
  failed int not null default 0,
  locked_until timestamptz
);
insert into public.salon_secrets (id) values (1) on conflict do nothing;
alter table public.salon_secrets enable row level security; -- aucune règle : personne ne la lit via l'API

create or replace function public.set_validation_pin(p text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'Réservé à l''administrateur.'; end if;
  if p is null or length(p) < 4 then raise exception 'Le code doit contenir au moins 4 caractères.'; end if;
  update public.salon_secrets set pin_hash = crypt(p, gen_salt('bf')), failed = 0, locked_until = null where id = 1;
end;
$$;

create or replace function public.has_validation_pin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() and exists (select 1 from public.salon_secrets where id = 1 and pin_hash is not null);
$$;

-- Vérifie le code ; 10 erreurs => blocage 15 minutes. Renvoie un message d'erreur, ou null si le code est bon.
-- (Pas d'exception : elle annulerait le compteur d'erreurs.)
create or replace function public.check_validation_pin(p text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  s public.salon_secrets;
begin
  select * into s from public.salon_secrets where id = 1 for update;
  if s.pin_hash is null then return 'Le gérant n''a pas encore choisi de code de validation.'; end if;
  if s.locked_until is not null and s.locked_until > now() then
    return 'Trop d''essais. Réessayez dans quelques minutes.';
  end if;
  if crypt(coalesce(p, ''), s.pin_hash) = s.pin_hash then
    update public.salon_secrets set failed = 0, locked_until = null where id = 1;
    return null;
  end if;
  update public.salon_secrets
    set failed = case when s.failed + 1 >= 10 then 0 else s.failed + 1 end,
        locked_until = case when s.failed + 1 >= 10 then now() + interval '15 minutes' else null end
    where id = 1;
  return 'Code incorrect.';
end;
$$;

create or replace function public.appointment_for_validation(appt_id uuid, p text) returns json
language plpgsql security definer set search_path = public as $$
declare
  err text := public.check_validation_pin(p);
  r json;
begin
  if err is not null then return json_build_object('error', err); end if;
  select row_to_json(a) into r from public.appointments a where a.id = appt_id;
  if r is null then return json_build_object('error', 'Rendez-vous introuvable.'); end if;
  return json_build_object('appointment', r);
end;
$$;

create or replace function public.validate_appointment(appt_id uuid, p text, new_status text) returns json
language plpgsql security definer set search_path = public as $$
declare
  err text := public.check_validation_pin(p);
  r json;
begin
  if err is not null then return json_build_object('error', err); end if;
  if new_status not in ('confirmed', 'cancelled', 'pending') then
    return json_build_object('error', 'Statut invalide.');
  end if;
  update public.appointments set status = new_status where id = appt_id;
  select row_to_json(a) into r from public.appointments a where a.id = appt_id;
  if r is null then return json_build_object('error', 'Rendez-vous introuvable.'); end if;
  return json_build_object('appointment', r);
end;
$$;

revoke execute on function public.check_validation_pin(text) from public, anon, authenticated;
grant execute on function public.appointment_for_validation(uuid, text) to anon, authenticated;
grant execute on function public.validate_appointment(uuid, text, text) to anon, authenticated;
grant execute on function public.set_validation_pin(text) to authenticated;
grant execute on function public.has_validation_pin() to authenticated;

-- ---------- Communauté ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
drop policy if exists "publications publiques" on public.posts;
create policy "publications publiques" on public.posts for select using (true);
drop policy if exists "publier" on public.posts;
create policy "publier" on public.posts for insert with check (author_id = auth.uid());
drop policy if exists "supprimer publication" on public.posts;
create policy "supprimer publication" on public.posts for delete using (author_id = auth.uid() or public.is_admin());

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;
drop policy if exists "likes publics" on public.post_likes;
create policy "likes publics" on public.post_likes for select using (true);
drop policy if exists "aimer" on public.post_likes;
create policy "aimer" on public.post_likes for insert with check (user_id = auth.uid());
drop policy if exists "ne plus aimer" on public.post_likes;
create policy "ne plus aimer" on public.post_likes for delete using (user_id = auth.uid());

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;
drop policy if exists "commentaires publics" on public.comments;
create policy "commentaires publics" on public.comments for select using (true);
drop policy if exists "commenter" on public.comments;
create policy "commenter" on public.comments for insert with check (author_id = auth.uid());
drop policy if exists "supprimer commentaire" on public.comments;
create policy "supprimer commentaire" on public.comments for delete using (author_id = auth.uid() or public.is_admin());

-- ---------- Stockage des images ----------
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images publiques" on storage.objects;
create policy "images publiques" on storage.objects for select using (bucket_id = 'images');
drop policy if exists "envoyer une image" on storage.objects;
create policy "envoyer une image" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
--  Après avoir créé VOTRE compte sur le site, donnez-vous le rôle admin :
--
--    update public.profiles set role = 'admin' where email = 'votre@email.com';
--
--  Puis, connecté en admin sur le site : Paramètres > « Code de validation du salon ».
-- =====================================================================
