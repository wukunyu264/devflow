import { createHash } from "node:crypto";
import { cloudClient, isCloud, localDatabase } from "./store";

export async function takeAuthAttempt(email: string) {
  // Store only a stable digest; neither email addresses nor tokens enter the counter table.
  const key = createHash("sha256").update(`devflow:auth:${email.trim().toLowerCase()}`).digest("hex");
  if (isCloud) {
    const {data,error} = await cloudClient().rpc("take_auth_attempt", {bucket:key});
    if (error) throw new Error("Authentication limiter unavailable. Apply supabase/004_production_hardening.sql.");
    return data === true;
  }
  const db = await localDatabase();
  const now = Date.now();
  db.prepare("DELETE FROM auth_attempts WHERE expires_at < ?").run(now);
  const row = db.prepare(`INSERT INTO auth_attempts (bucket,count,expires_at) VALUES (?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET count = auth_attempts.count + 1 RETURNING count`).get(key,now+900000);
  return Number(row?.count) <= 12;
}
