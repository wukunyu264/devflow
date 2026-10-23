-- DevFlow / Supabase PostgreSQL
-- Run once in the project's SQL editor, followed by 002_seed.sql.
-- Uses the public anon key with user JWTs. A service-role key is NOT required.
begin;
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 24),
  bio text not null default '每一次分享，都是成长的开始。' check (char_length(bio) <= 160),
  color text not null default '#d6e9d9' check (color ~ '^#[0-9a-fA-F]{6}$'),
  role text not null default '社区创作者' check (char_length(role) <= 30),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (slug text primary key, name text not null);
insert into public.categories values ('frontend','前端开发'),('backend','后端开发'),('ai','人工智能'),('java','Java'),('python','Python'),('database','数据库'),('tools','开发工具'),('architecture','架构设计');
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  excerpt text not null default '' check (char_length(excerpt) <= 250),
  content text not null default '' check (char_length(content) <= 100000),
  category text not null references public.categories(slug),
  tags text[] not null default '{}' check (cardinality(tags) <= 4),
  cover text not null default 'none' check (cover in ('react','ai','typescript','next','css','agent','java','python','database','git','architecture','terminal','none')),
  status text not null default 'draft' check (status in ('draft','published')),
  views integer not null default 0 check (views >= 0),
  seed_likes integer not null default 0 check (seed_likes >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status = 'draft' or (char_length(title) >= 4 and char_length(content) >= 20))
);
create index articles_published_date on public.articles(created_at desc) where status = 'published';
create index articles_author on public.articles(author_id);
create index articles_category on public.articles(category, created_at desc);
create index articles_tags on public.articles using gin(tags);
create table public.tags (id uuid primary key default gen_random_uuid(), name text not null unique check (char_length(name) between 1 and 20));
create table public.article_tags (article_id uuid references public.articles(id) on delete cascade, tag_id uuid references public.tags(id) on delete cascade, primary key(article_id, tag_id));
create table public.likes (id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(article_id,user_id));
create table public.bookmarks (id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(article_id,user_id));
create index bookmarks_user on public.bookmarks(user_id);
create table public.comments (id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, content text not null check (char_length(trim(content)) between 1 and 1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index comments_article_date on public.comments(article_id, created_at desc);
create table public.follows (id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(author_id,user_id), check(author_id <> user_id));
create index follows_user on public.follows(user_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger articles_updated before update on public.articles for each row execute function public.set_updated_at();
create trigger comments_updated before update on public.comments for each row execute function public.set_updated_at();

create function public.on_user_created() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'name',''),'新朋友'),24));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.on_user_created();

-- Keep normalized tags in sync with the article's convenient API representation.
create function public.sync_article_tags() returns trigger language plpgsql security definer set search_path = '' as $$
declare tag_name text;
begin
  delete from public.article_tags where article_id = new.id;
  foreach tag_name in array new.tags loop
    if char_length(trim(tag_name)) not between 1 and 20 then raise exception 'Invalid tag'; end if;
    insert into public.tags(name) values(trim(tag_name)) on conflict(name) do nothing;
    insert into public.article_tags(article_id,tag_id) select new.id,id from public.tags where name = trim(tag_name) on conflict do nothing;
  end loop;
  return new;
end; $$;
create trigger sync_tags after insert or update of tags on public.articles for each row execute function public.sync_article_tags();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.articles enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

create policy profiles_read on public.profiles for select to anon,authenticated using(true);
create policy profiles_insert_own on public.profiles for insert to authenticated with check(id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using(id = (select auth.uid())) with check(id = (select auth.uid()));
create policy categories_read on public.categories for select to anon,authenticated using(true);
create policy tags_read on public.tags for select to anon,authenticated using(true);
create policy articles_read on public.articles for select to anon,authenticated using(status = 'published' or author_id = (select auth.uid()));
create policy articles_insert_own on public.articles for insert to authenticated with check(author_id = (select auth.uid()));
create policy articles_update_own on public.articles for update to authenticated using(author_id = (select auth.uid())) with check(author_id = (select auth.uid()));
create policy articles_delete_own on public.articles for delete to authenticated using(author_id = (select auth.uid()));
create policy article_tags_read on public.article_tags for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id));
create policy likes_read on public.likes for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy likes_insert_own on public.likes for insert to authenticated with check(user_id = (select auth.uid()) and exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy likes_delete_own on public.likes for delete to authenticated using(user_id = (select auth.uid()));
create policy bookmarks_read_own on public.bookmarks for select to authenticated using(user_id = (select auth.uid()));
create policy bookmarks_insert_own on public.bookmarks for insert to authenticated with check(user_id = (select auth.uid()) and exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy bookmarks_delete_own on public.bookmarks for delete to authenticated using(user_id = (select auth.uid()));
create policy comments_read on public.comments for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy comments_insert_own on public.comments for insert to authenticated with check(user_id = (select auth.uid()) and exists(select 1 from public.articles a where a.id=article_id and a.status='published'));
create policy comments_delete_own on public.comments for delete to authenticated using(user_id = (select auth.uid()));
create policy follows_read on public.follows for select to anon,authenticated using(true);
create policy follows_insert_own on public.follows for insert to authenticated with check(user_id = (select auth.uid()) and user_id <> author_id);
create policy follows_delete_own on public.follows for delete to authenticated using(user_id = (select auth.uid()));

-- Prevent callers from changing owners, initial historical metrics or creation dates.
create function public.protect_article_metadata() returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() in ('anon','authenticated') then
    if TG_OP = 'INSERT' then new.views := 0; new.seed_likes := 0; new.created_at := now();
    elsif new.author_id <> old.author_id or new.seed_likes <> old.seed_likes or new.created_at <> old.created_at then raise exception 'Immutable metadata';
    end if;
    if TG_OP = 'UPDATE' and new.views <> old.views and current_setting('devflow.incrementing_view',true) is distinct from 'on' then raise exception 'Use view function'; end if;
  end if;
  return new;
end; $$;
create trigger protect_metadata before insert or update on public.articles for each row execute function public.protect_article_metadata();

create function public.increment_article_views(article_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('devflow.incrementing_view','on',true);
  update public.articles set views = views + 1 where id = article_id and status = 'published';
end; $$;

-- Explicit grants are required on projects that default to restricted table privileges.
grant usage on schema public to anon,authenticated;
grant select on public.profiles,public.categories,public.tags,public.article_tags,public.articles,public.likes,public.comments,public.follows to anon,authenticated;
grant select on public.bookmarks to authenticated;
grant insert,update on public.profiles to authenticated;
grant insert,update,delete on public.articles to authenticated;
grant insert,delete on public.likes,public.bookmarks,public.comments,public.follows to authenticated;
revoke all on function public.increment_article_views(uuid) from public;
grant execute on function public.increment_article_views(uuid) to authenticated;
revoke all on function public.on_user_created(),public.sync_article_tags(),public.protect_article_metadata(),public.set_updated_at() from public;
commit;
