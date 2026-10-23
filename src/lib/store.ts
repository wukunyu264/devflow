import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { authors, seedArticles } from "./seed";
import { backendConfig } from "./backend";
import type { ArticleSummary } from "./types";
export const articleColumns = "id,author_id,title,excerpt,category,tags,cover,status,views,seed_likes,created_at,updated_at";
const fields: Record<Table, string> = {
  articles: articleColumns + ",content", profiles: "id,name,bio,color,role,created_at",
  comments: "id,article_id,user_id,content,created_at", likes: "id,article_id,user_id,created_at",
  bookmarks: "id,article_id,user_id,created_at", follows: "id,author_id,user_id,created_at",
};

export type Table =
  "profiles" | "articles" | "comments" | "likes" | "bookmarks" | "follows";
type RecordData = Record<string, unknown>;
const tables: Table[] = [
  "profiles",
  "articles",
  "comments",
  "likes",
  "bookmarks",
  "follows",
];
export const isCloud = backendConfig().backend === "supabase";
export function cloudClient(token?: string): SupabaseClient {
  const { url, key } = backendConfig();
  return createClient(
    url!,
    key!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
    },
  );
}
let database: DatabaseSync | undefined;
export async function localDatabase() {
  if (backendConfig().backend !== "local") throw new Error("SQLite is available only with DATA_BACKEND=local.");
  if (database) return database;
  const { DatabaseSync: SQLite } = await import("node:sqlite");
  if (database) return database;
  const directory = process.env.LOCAL_DATA_DIR || join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  database = new SQLite(join(directory, "devflow.sqlite"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS auth_attempts (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS article_views_daily (article_id TEXT NOT NULL, user_id TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(article_id,user_id,day));
    CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL, bio TEXT NOT NULL, color TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS credentials (user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES profiles(id), title TEXT NOT NULL, excerpt TEXT NOT NULL, content TEXT NOT NULL, category TEXT NOT NULL, tags TEXT NOT NULL, cover TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('published','draft')), views INTEGER NOT NULL DEFAULT 0, seed_likes INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS articles_status_date ON articles(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS articles_author ON articles(author_id);
    CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS comments_article ON comments(article_id);
    CREATE TABLE IF NOT EXISTS likes (id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, created_at TEXT NOT NULL, UNIQUE(article_id, user_id));
    CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, created_at TEXT NOT NULL, UNIQUE(article_id, user_id));
    CREATE TABLE IF NOT EXISTS follows (id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, created_at TEXT NOT NULL, UNIQUE(author_id, user_id), CHECK(author_id <> user_id));
  `);
  if (!database.prepare("SELECT id FROM profiles LIMIT 1").get()) {
    database.exec("BEGIN");
    try {
      for (const profile of authors) insertLocal(database, "profiles", profile);
      for (const article of seedArticles)
        insertLocal(database, "articles", article);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
  return database;
}
function encode(value: unknown): SQLInputValue {
  if (Array.isArray(value)) return JSON.stringify(value);
  return value as SQLInputValue;
}
function decode(row: RecordData) {
  if (typeof row.tags === "string") row.tags = JSON.parse(row.tags);
  return { ...row };
}
function insertLocal(db: DatabaseSync, table: Table, data: RecordData) {
  const keys = Object.keys(data);
  db.prepare(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
  ).run(...Object.values(data).map(encode));
}
function where(filters: RecordData) {
  return Object.keys(filters).length
    ? ` WHERE ${Object.keys(filters)
        .map((k) => `${k} = ?`)
        .join(" AND ")}`
    : "";
}
export class Store {
  client?: SupabaseClient;
  constructor(token?: string) {
    if (isCloud) this.client = cloudClient(token);
  }
  async list<T>(table: Table, filters: RecordData = {}, limit = 500): Promise<T[]> {
    if (!tables.includes(table)) throw new Error("Invalid table");
    if (process.env.DATA_TRACE === "1") console.info(`[DevFlow query] ${table}`);
    if (this.client) {
      let query = this.client.from(table).select(fields[table]).limit(limit);
      for (const [key, value] of Object.entries(filters))
        query = query.eq(key, value);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    }
    const db = await localDatabase();
    return db
      .prepare(`SELECT ${fields[table]} FROM ${table}${where(filters)} LIMIT ?`)
      .all(...Object.values(filters).map(encode), limit)
      .map(decode) as T[];
  }
  async summaries(userId?: string, limit = 200, offset = 0): Promise<ArticleSummary[]> {
    if (process.env.DATA_TRACE === "1") console.info("[DevFlow query] article_summaries");
    if (this.client) {
      let query = this.client.from("article_summaries").select(articleColumns + ",reading_minutes")
        .order("created_at", {ascending:false}).order("id", {ascending:false}).range(offset, offset + limit - 1);
      query = userId ? query.or(`status.eq.published,author_id.eq.${userId}`) : query.eq("status", "published");
      const {data,error} = await query.returns<ArticleSummary[]>();
      if (error) throw new Error(`Apply supabase/004_production_hardening.sql: ${error.code}`);
      return (data ?? []) as ArticleSummary[];
    }
    return (await localDatabase()).prepare(`SELECT ${articleColumns}, max(2, CAST((length(content) + 449) / 450 AS INTEGER)) AS reading_minutes
      FROM articles WHERE status = 'published' ${userId ? "OR author_id = ?" : ""}
      ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).all(...(userId ? [userId] : []), limit, offset).map(decode) as ArticleSummary[];
  }
  async insert<T>(table: Table, data: RecordData): Promise<T> {
    if (this.client) {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return result as T;
    }
    insertLocal(await localDatabase(), table, data);
    return data as T;
  }
  async update(table: Table, data: RecordData, filters: RecordData) {
    if (this.client) {
      let query = this.client.from(table).update(data);
      for (const [key, value] of Object.entries(filters))
        query = query.eq(key, value);
      const { error } = await query;
      if (error) throw new Error(error.message);
      return;
    }
    const db = await localDatabase();
    db.prepare(
      `UPDATE ${table} SET ${Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(",")}${where(filters)}`,
    ).run(
      ...Object.values(data).map(encode),
      ...Object.values(filters).map(encode),
    );
  }
  async delete(table: Table, filters: RecordData) {
    if (this.client) {
      let query = this.client.from(table).delete();
      for (const [key, value] of Object.entries(filters))
        query = query.eq(key, value);
      const { error } = await query;
      if (error) throw new Error(error.message);
      return;
    }
    (await localDatabase())
      .prepare(`DELETE FROM ${table}${where(filters)}`)
      .run(...Object.values(filters).map(encode));
  }
  async view(id: string, userId: string) {
    if (this.client) {
      const { error } = await this.client.rpc("increment_article_views", {
        article_id: id,
      });
      if (error) throw new Error(error.message);
    } else {
      const db = await localDatabase();
      const day = new Date().toISOString().slice(0,10);
      db.exec("BEGIN IMMEDIATE");
      try {
        const inserted = db.prepare("INSERT OR IGNORE INTO article_views_daily(article_id,user_id,day) VALUES (?,?,?)").run(id,userId,day);
        if (inserted.changes) db.prepare("UPDATE articles SET views = views + 1 WHERE id = ? AND status = 'published'").run(id);
        db.exec("COMMIT");
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }
  }
}
