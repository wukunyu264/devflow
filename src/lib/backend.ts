type Environment = Record<string, string | undefined>;

export function backendConfig(env: Environment = process.env) {
  const serverless = ["VERCEL", "NETLIFY", "AWS_LAMBDA_FUNCTION_NAME", "FUNCTION_TARGET", "K_SERVICE", "CF_PAGES"]
    .some(name => Boolean(env[name]) && env[name] !== "false");
  const url = env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const backend = env.DATA_BACKEND || (serverless || env.NODE_ENV === "production" || url || key ? "supabase" : "local");
  if (backend !== "local" && backend !== "supabase")
    throw new Error("DATA_BACKEND must be supabase or local.");
  if (backend === "local" && serverless)
    throw new Error("DATA_BACKEND=local is not supported in serverless environments. Configure DATA_BACKEND=supabase and its URL/key.");
  if (backend === "supabase") {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(Boolean);
    if (missing.length) throw new Error(`DATA_BACKEND=supabase: missing ${missing.join(", ")}. Set these variables for both Builds and Functions, then redeploy.`);
    let parsed: URL;
    try { parsed = new URL(url!); } catch { throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL."); }
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }
  return { backend, url, key } as const;
}
