-- Read-only catalog checks + a disposable rate-limit bucket rolled back at the end.
-- Run as postgres in SQL Editor AFTER 004. No user/article/session changes.
begin;
do $$
declare bucket text := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
begin
  if has_function_privilege('anon','public.increment_article_views(uuid)','execute') then
    raise exception 'anon can still increment views';
  end if;
  if not has_function_privilege('authenticated','public.devflow_session_active()','execute') then
    raise exception 'Session validator grant missing';
  end if;
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='article_summaries' and 'security_invoker=true'=any(c.reloptions)) then
    raise exception 'List view must use security_invoker=true';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='article_summaries' and column_name='content') then
    raise exception 'List view leaks article body';
  end if;
  if (select count(*) from pg_policies where schemaname='public' and policyname='active_session' and permissive='RESTRICTIVE') <> 6 then
    raise exception 'Restrictive session policies incomplete';
  end if;
  if to_regclass('public.articles_search') is not null then raise exception 'Unused search index remains'; end if;
  for i in 1..12 loop
    if not public.take_auth_attempt(bucket) then raise exception 'Limiter rejected early'; end if;
  end loop;
  if public.take_auth_attempt(bucket) then raise exception 'Limiter failed to reject attempt 13'; end if;
end; $$;
select 'PASS: projection, privileges, RLS policies, index cleanup, limiter' as result;
rollback;
