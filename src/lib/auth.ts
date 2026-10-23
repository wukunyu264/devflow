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
export async function context(writeCookies = true): Promise<{
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
      if (refresh && writeCookies) {
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
  if (isCloud && userId && token) {
    const {data,error} = await cloudClient(token).rpc("devflow_session_active");
    if (error) throw new Error("Session validation unavailable. Apply supabase/004_production_hardening.sql.");
    if (data !== true) userId = undefined;
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
  if (token && isCloud) {
    // GoTrue's /logout endpoint accepts the user's JWT and the publishable key.
    // No admin/service-role credential is used. Do not report success on failure.
    const auth = cloudClient();
    let activeToken = token;
    const verified = await auth.auth.getUser(activeToken);
    if (verified.error) {
      const refresh = jar.get("df_refresh")?.value;
      if (refresh) {
        const renewed = await auth.auth.refreshSession({refresh_token:refresh});
        if (renewed.error && (![400,401,403].includes(renewed.error.status ?? 0))) throw new Error("云端退出暂时失败，请重试。");
        activeToken = renewed.data.session?.access_token || "";
      } else if (![401,403,404].includes(verified.error.status ?? 0)) {
        throw new Error("云端退出暂时失败，请重试。");
      } else activeToken = "";
    }
    if (activeToken) {
      const {error} = await auth.auth.admin.signOut(activeToken, "local");
      const revoked = await cloudClient(activeToken).rpc("devflow_session_active");
      if (revoked.error || revoked.data !== false || (error && ![401,403,404].includes(error.status ?? 0)))
        throw new Error("云端会话尚未确认撤销，请重试退出。");
    }
  }
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
