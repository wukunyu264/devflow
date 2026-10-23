-- Apply AFTER 001_schema.sql. Safe to rerun on existing installations.
begin;
create or replace view public.article_summaries with (security_invoker = true) as
select id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at,
  greatest(2,ceil(char_length(content)::numeric / 450))::integer as reading_minutes
from public.articles;
grant select on public.article_summaries to anon,authenticated;
-- Counters live in a non-exposed schema. Neither role can write tables directly.
create schema if not exists devflow_private;
revoke all on schema devflow_private from public,anon,authenticated;
create table if not exists devflow_private.auth_attempts (
  bucket text primary key, count integer not null, expires_at timestamptz not null
);
create or replace function public.take_auth_attempt(bucket text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare attempts integer;
begin
  if bucket !~ '^[0-9a-f]{64}$' then raise exception 'Invalid bucket'; end if;
  delete from devflow_private.auth_attempts a where a.expires_at < now();
  insert into devflow_private.auth_attempts as a(bucket,count,expires_at)
    values (bucket,1,now() + interval '15 minutes')
    on conflict on constraint auth_attempts_pkey do update set count = a.count + 1
    returning count into attempts;
  return attempts <= 12;
end; $$;
revoke all on function public.take_auth_attempt(text) from public;
grant execute on function public.take_auth_attempt(text) to anon,authenticated;

-- JWT signature validation alone does not immediately revoke a logged-out JWT.
-- Only report a session active when its signed session_id belongs to auth.uid().
create or replace function public.devflow_session_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.sessions s
    where s.id = (auth.jwt()->>'session_id')::uuid and s.user_id = auth.uid());
$$;
revoke all on function public.devflow_session_active() from public,anon;
grant execute on function public.devflow_session_active() to authenticated;
-- Restrictive policies AND with the existing ownership policies, including direct REST calls.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','articles','comments','likes','bookmarks','follows'] loop
    execute format('drop policy if exists active_session on public.%I',table_name);
    execute format('create policy active_session on public.%I as restrictive for all to authenticated using ((select public.devflow_session_active())) with check ((select public.devflow_session_active()))',table_name);
  end loop;
end; $$;

create table if not exists devflow_private.article_views_daily (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null, primary key(article_id,user_id,day)
);
create or replace function public.increment_article_views(article_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare inserted integer;
begin
  if not public.devflow_session_active() then raise exception 'Active session required'; end if;
  if not exists(select 1 from public.articles a where a.id=article_id and a.status='published') then return; end if;
  insert into devflow_private.article_views_daily values(article_id,auth.uid(),(now() at time zone 'UTC')::date)
    on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    perform set_config('devflow.incrementing_view','on',true);
    update public.articles a set views = a.views + 1 where a.id=article_id and a.status='published';
  end if;
end; $$;
revoke all on function public.increment_article_views(uuid) from public,anon;
grant execute on function public.increment_article_views(uuid) to authenticated;
-- The app searches title/excerpt/tags/author in the bounded list, not tsvector.
drop index if exists public.articles_search;
commit;
