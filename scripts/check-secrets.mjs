import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Inspect staged blobs, never print their contents or credentials.
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 });
const worktree = process.argv.includes("--worktree");
const files = (worktree ? git("ls-files", "--cached", "--others", "--exclude-standard", "-z") : git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")).split("\0").filter(Boolean).filter(file => !worktree || existsSync(file));
if (!files.length) {
  console.error("No staged files to inspect. Stage the intended source files first.");
  process.exit(1);
}
const values = existsSync(".env.local")
  ? readFileSync(".env.local", "utf8").split(/\r?\n/).flatMap(line => {
      const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || !/KEY|TOKEN|SECRET|PASSWORD/.test(match[1])) return [];
      const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
      return value.length >= 16 ? [value] : [];
    })
  : [];
const forbiddenPath = /(^|\/)(?:\.env(?!\.example$)[^/]*|data|node_modules|\.next|\.vercel|test-results)(?:\/|$)/;
const secretPattern = /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/;
const failures = [];
for (const file of files) {
  if (forbiddenPath.test(file)) { failures.push(`${file}: forbidden private/generated path`); continue; }
  const text = worktree ? readFileSync(file,"utf8") : git("show", `:${file}`);
  if (secretPattern.test(text) || values.some(value => text.includes(value))) failures.push(`${file}: possible credential found`);
  if (file === ".env.example" && text.split(/\r?\n/).some(line => /^\s*[A-Z_][A-Z0-9_]*\s*=\s*\S/.test(line))) failures.push(`${file}: template must contain empty values only`);
}
if (failures.length) {
  console.error("Upload blocked. Credentials have not been printed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${files.length} ${worktree ? "worktree" : "staged"} files checked; no private/generated paths or matching credentials found.`);
}
