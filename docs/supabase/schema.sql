-- =====================================================================
-- EsgotoZero · banco de dados para a versão com contas reais (Supabase)
-- =====================================================================
-- Como usar: no painel do Supabase, abra "SQL Editor" > "New query",
-- cole este arquivo inteiro e clique em "Run". Rode uma vez só, num projeto novo.
--
-- O que este arquivo cria:
--   profiles        perfil de cada pessoa (nome de exibição e papel: cidadão ou gestor)
--   reports         os relatos (equivale aos objetos de EZ.store.reports no protótipo)
--   report_events   o histórico de cada relato (equivale a report.history)
--   confirmations   o "Eu também vi" (uma confirmação por pessoa e relato)
--   bucket "fotos"  armazenamento PRIVADO das fotos, com regras de acesso
--
-- Regras de acesso (RLS), em resumo:
--   * visitante sem conta: vê só relatos publicados;
--   * cidadão: vê os publicados e os próprios; cria relatos (sempre como "Recebido" e fora do mapa);
--   * gestor: vê e altera tudo, registra o histórico.
-- Para tornar alguém gestor, rode no SQL Editor (troque o e-mail):
--   update public.profiles set role = 'manager'
--   where id = (select id from auth.users where email = 'pessoa@exemplo.com');
-- =====================================================================

-- ---------- perfis ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Cidadão' check (char_length(display_name) between 2 and 60),
  role         text not null default 'citizen' check (role in ('citizen', 'manager')),
  created_at   timestamptz not null default now()
);

-- cria o perfil automaticamente quando alguém se cadastra
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1), 'Cidadão'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- "esta pessoa é gestora?" (security definer: evita recursão nas regras de acesso)
create function public.is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'manager');
$$;

-- ---------- relatos ----------
create sequence public.report_protocol_seq start 1001;

create table public.reports (
  id             bigint generated always as identity primary key,
  protocol       text not null unique default 'EZ-' || lpad(nextval('public.report_protocol_seq')::text, 4, '0'),
  author_id      uuid references auth.users (id) on delete set null default auth.uid(),
  title          text not null check (char_length(title) between 6 and 90),
  category       text not null check (category in ('despejo', 'rede', 'aspecto', 'residuos', 'mortandade', 'outro')),
  signs          text[] not null default '{}',
  severity       text not null default 'media' check (severity in ('baixa', 'media', 'alta')),
  water          text not null check (water in ('rio', 'corrego', 'canal', 'praia', 'lagoa', 'mangue', 'rua', 'outro')),
  water_name     text check (char_length(water_name) <= 80),
  place          text not null check (char_length(place) between 4 and 120),
  city           text not null,
  uf             char(2) not null,
  lat            double precision not null check (lat between -34 and 6),
  lng            double precision not null check (lng between -75 and -28),
  description    text not null check (char_length(description) between 20 and 1500),
  observed       date not null,
  ongoing        boolean not null default false,
  status         text not null default 'recebido' check (status in ('recebido', 'triagem', 'encaminhado', 'encerrado')),
  published      boolean not null default false,
  photo_path     text,                                   -- caminho no bucket "fotos": <id do autor>/<arquivo>.jpg
  photo_consent  boolean not null default false,
  photo_reviewed boolean not null default false,
  confirmations  integer not null default 0,             -- mantido automaticamente pela tabela confirmations
  close_reason   text check (close_reason in ('resolvido', 'duplicado', 'sem-elementos', 'fora-escopo', 'outro')),
  duplicate_of   bigint references public.reports (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint publicar_so_depois_da_triagem check (not (published and status = 'recebido')),
  constraint encerrado_tem_motivo check (status <> 'encerrado' or close_reason is not null)
);
create index reports_published_idx on public.reports (published, created_at desc);
create index reports_author_idx on public.reports (author_id);
create index reports_uf_idx on public.reports (uf);

-- quem não é gestor sempre cria o relato como "Recebido", fora do mapa e em nome próprio
create function public.reports_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_manager() then
    new.author_id      := auth.uid();
    new.status         := 'recebido';
    new.published      := false;
    new.photo_reviewed := false;
    new.confirmations  := 0;
    new.close_reason   := null;
    new.duplicate_of   := null;
  end if;
  if new.observed > current_date then
    raise exception 'A data observada não pode estar no futuro.';
  end if;
  return new;
end $$;
create trigger reports_before_insert before insert on public.reports
  for each row execute function public.reports_before_insert();

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

-- ---------- histórico ----------
create table public.report_events (
  id                bigint generated always as identity primary key,
  report_id         bigint not null references public.reports (id) on delete cascade,
  status            text not null check (status in ('recebido', 'triagem', 'encaminhado', 'encerrado')),
  title             text not null,
  note              text not null check (char_length(note) between 10 and 1200),
  recipient         text,          -- órgão, quando o relato é encaminhado
  external_protocol text,          -- protocolo informado pelo órgão
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now()
);
create index report_events_report_idx on public.report_events (report_id, created_at);

-- todo relato novo já nasce com o evento "Relato recebido"
create function public.reports_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.report_events (report_id, status, title, note, created_by)
  values (new.id, 'recebido', 'Relato recebido', 'Registro criado pela comunidade no EsgotoZero.', new.author_id);
  return new;
end $$;
create trigger reports_after_insert after insert on public.reports
  for each row execute function public.reports_after_insert();

-- ---------- "Eu também vi" ----------
create table public.confirmations (
  report_id  bigint not null references public.reports (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create function public.sync_confirmations() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid bigint := coalesce(new.report_id, old.report_id);
begin
  update public.reports set confirmations = (select count(*) from public.confirmations where report_id = rid) where id = rid;
  return null;
end $$;
create trigger confirmations_sync after insert or delete on public.confirmations
  for each row execute function public.sync_confirmations();

-- ---------- regras de acesso (RLS) ----------
alter table public.profiles      enable row level security;
alter table public.reports       enable row level security;
alter table public.report_events enable row level security;
alter table public.confirmations enable row level security;

-- perfis: cada pessoa vê o próprio; a equipe vê todos. Só o nome pode ser alterado pela própria pessoa.
create policy "perfil: ler o próprio ou ser gestor" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_manager());
create policy "perfil: alterar o próprio nome" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;   -- ninguém se promove a gestor sozinho

-- relatos
create policy "relatos: publicados, próprios ou gestor" on public.reports
  for select to anon, authenticated using (published or author_id = auth.uid() or public.is_manager());
create policy "relatos: pessoa com conta cria" on public.reports
  for insert to authenticated with check (auth.uid() is not null);
create policy "relatos: só a equipe altera" on public.reports
  for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "relatos: só a equipe apaga" on public.reports
  for delete to authenticated using (public.is_manager());

-- histórico: visível para quem pode ver o relato; só a equipe escreve
create policy "histórico: segue o relato" on public.report_events
  for select to anon, authenticated using (exists (select 1 from public.reports r where r.id = report_id));
create policy "histórico: só a equipe registra" on public.report_events
  for insert to authenticated with check (public.is_manager());

-- confirmações: cada pessoa confirma relatos publicados de outras pessoas, uma vez
create policy "confirmação: ver as próprias" on public.confirmations
  for select to authenticated using (user_id = auth.uid() or public.is_manager());
create policy "confirmação: confirmar relato publicado de outra pessoa" on public.confirmations
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.reports r where r.id = report_id and r.published and r.author_id is distinct from auth.uid()));
create policy "confirmação: desfazer a própria" on public.confirmations
  for delete to authenticated using (user_id = auth.uid());

-- ---------- fotos (Storage) ----------
-- bucket privado: a foto original nunca fica pública direto
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false)
  on conflict (id) do nothing;

-- cada pessoa envia fotos só para a própria pasta: <id do usuário>/arquivo.jpg
create policy "fotos: enviar na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- quem pode ver: o autor, a equipe e, depois da revisão e com autorização, qualquer pessoa
create policy "fotos: autor, equipe ou foto revisada" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'fotos' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_manager()
      or exists (select 1 from public.reports r
                 where r.photo_path = storage.objects.name and r.published and r.photo_consent and r.photo_reviewed)
    )
  );
