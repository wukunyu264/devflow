export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { backendConfig } = await import("./lib/backend");
    backendConfig();
  }
}
