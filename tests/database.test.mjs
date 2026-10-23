import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL migration: projections, RLS, persistent limiter, deduplicated views and revoked JWT sessions', async () => {
  const db = new PGlite();
  try {
    // A local contract fixture for Supabase JWT functions/session table, never cloud Auth.
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
      create function auth.role() returns text language sql stable as $$select coalesce(auth.jwt()->>'role',current_user)$$;
      grant usage on schema auth to anon,authenticated;`);
    const schema = (await readFile('supabase/001_schema.sql','utf8')).replace('create extension if not exists pgcrypto;','');
    await db.exec(schema);
    await db.exec(await readFile('supabase/002_seed.sql','utf8'));
    const migration = await readFile('supabase/004_production_hardening.sql','utf8');
    await db.exec(migration);
    await db.exec(migration); // upgrades must remain repeatable
    const user='30000000-0000-4000-8000-000000000001';
    const session='40000000-0000-4000-8000-000000000001';
    const article='50000000-0000-4000-8000-000000000001';
    await db.query('insert into auth.users(id) values ($1)',[user]);
    await db.query('insert into auth.sessions values ($1,$2)',[session,user]);
    async function identity(role, claims={}) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({role,...claims})]);
      await db.exec(`set role ${role}`);
    }
    await identity('anon');
    const summary = (await db.query('select * from public.article_summaries limit 1')).rows[0];
    assert.ok(summary && !Object.hasOwn(summary,'content'));
    assert.ok(summary.reading_minutes >= 2);
    await assert.rejects(db.query('select public.increment_article_views($1)',[summary.id]), /permission denied/);
    await assert.rejects(db.query('select * from devflow_private.auth_attempts'), /permission denied/);
    const bucket='e'.repeat(64);
    for (let i=0;i<13;i++) {
      const result = await db.query('select public.take_auth_attempt($1) as allowed',[bucket]);
      assert.equal(result.rows[0].allowed,i<12);
    }
    await identity('authenticated',{sub:user,session_id:session});
    assert.equal((await db.query('select public.devflow_session_active() as active')).rows[0].active,true);
    await db.query(`insert into public.articles(id,author_id,title,content,category,status)
      values ($1,$2,'测试 PostgreSQL 权限','测试正文必须足够长，用于验证实际数据库策略与会话。','frontend','published')`,[article,user]);
    await db.query('select public.increment_article_views($1)',[article]);
    await db.query('select public.increment_article_views($1)',[article]);
    assert.equal((await db.query('select views from public.articles where id=$1',[article])).rows[0].views,1);
    await db.exec('reset role');
    const otherUser='30000000-0000-4000-8000-000000000002';
    const otherSession='40000000-0000-4000-8000-000000000002';
    await db.query('insert into auth.users(id) values ($1)',[otherUser]);
    await db.query('insert into auth.sessions values ($1,$2)',[otherSession,otherUser]);
    await identity('authenticated',{sub:otherUser,session_id:otherSession});
    assert.equal((await db.query("update public.articles set title='他人不可改' where id=$1 returning id",[article])).rows.length,0);
    assert.equal((await db.query('delete from public.articles where id=$1 returning id',[article])).rows.length,0);
    // Revoke the server session while retaining exactly the same signed claim fixture.
    await db.exec('reset role');
    await db.query('delete from auth.sessions where id=$1',[session]);
    await identity('authenticated',{sub:user,session_id:session});
    assert.equal((await db.query('select public.devflow_session_active() as active')).rows[0].active,false);
    assert.equal((await db.query('select id from public.articles where id=$1',[article])).rows.length,0);
    await assert.rejects(db.query("insert into public.comments(article_id,user_id,content) values ($1,$2,'旧会话不能评论')",[article,user]),/row-level security/);
    await identity('anon');
    assert.equal((await db.query('select id from public.article_summaries where id=$1',[article])).rows.length,1);
  } finally { await db.close(); }
});
