import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { authors, seedArticles } from "./seed";

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
export const isCloud = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
export function cloudClient(token?: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  if (process.env.VERCEL)
    throw new Error(
      "上线需要配置 Supabase 数据库。请设置环境变量并运行初始化 SQL。",
    );
  if (database) return database;
  const { DatabaseSync: SQLite } = await import("node:sqlite");
  if (database) return database;
  const directory = join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  database = new SQLite(join(directory, "devflow.sqlite"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
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
  async list<T>(table: Table, filters: RecordData = {}): Promise<T[]> {
    if (!tables.includes(table)) throw new Error("Invalid table");
    if (this.client) {
      let query = this.client.from(table).select("*");
      for (const [key, value] of Object.entries(filters))
        query = query.eq(key, value);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    }
    const db = await localDatabase();
    return db
      .prepare(`SELECT * FROM ${table}${where(filters)}`)
      .all(...Object.values(filters).map(encode))
      .map(decode) as T[];
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
  async view(id: string) {
    if (this.client) {
      const { error } = await this.client.rpc("increment_article_views", {
        article_id: id,
      });
      if (error) throw new Error(error.message);
    } else {
      (await localDatabase())
        .prepare(
          "UPDATE articles SET views = views + 1 WHERE id = ? AND status = 'published'",
        )
        .run(id);
    }
  }
}
