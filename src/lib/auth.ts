import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cloudClient, isCloud, localDatabase, Store } from "./store";
import type { Profile } from "./types";

const scryptAsync = promisify(scrypt);
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  const original = Buffer.from(hex, "hex");
  return hash.length === original.length && timingSafeEqual(hash, original);
}
export async function setSession(access: string, refresh?: string) {
  const jar = await cookies();
  jar.set("df_session", access, cookieOptions);
  if (refresh) jar.set("df_refresh", refresh, cookieOptions);
}
export async function newLocalSession(id: string) {
  const token = randomBytes(32).toString("hex");
  const db = await localDatabase();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(
    new Date().toISOString(),
  );
  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(digest(token), id, new Date(Date.now() + 30 * 86400000).toISOString());
  await setSession(token);
}
export async function context(): Promise<{
  user: Profile | null;
  store: Store;
}> {
  const jar = await cookies();
  let token = jar.get("df_session")?.value;
  if (!token) return { user: null, store: new Store() };
  let userId: string | undefined;
  if (isCloud) {
    const auth = cloudClient();
    const { data, error } = await auth.auth.getUser(token);
    userId = data.user?.id;
    if (error) {
      const refresh = jar.get("df_refresh")?.value;
      if (refresh) {
        const result = await auth.auth.refreshSession({
          refresh_token: refresh,
        });
        if (result.data.session) {
          token = result.data.session.access_token;
          userId = result.data.user?.id;
          await setSession(token, result.data.session.refresh_token);
        }
      }
    }
  } else {
    const row = (await localDatabase())
      .prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?")
      .get(digest(token), new Date().toISOString());
    userId = row?.user_id as string | undefined;
  }
  const store = new Store(userId ? token : undefined);
  const user = userId
    ? ((await store.list<Profile>("profiles", { id: userId }))[0] ?? null)
    : null;
  return { user, store };
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("df_session")?.value;
  if (token && !isCloud)
    (await localDatabase())
      .prepare("DELETE FROM sessions WHERE id = ?")
      .run(digest(token));
  if (token && isCloud)
    await cloudClient(token).auth.admin.signOut(token, "local");
  jar.delete("df_session");
  jar.delete("df_refresh");
}
export function makeProfile(id: string, name: string): Profile {
  return {
    id,
    name,
    bio: "每一次分享，都是成长的开始。",
    color: "#d6e9d9",
    role: "社区创作者",
    created_at: new Date().toISOString(),
  };
}
export { randomUUID };
