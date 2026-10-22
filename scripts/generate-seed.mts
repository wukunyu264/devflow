import { writeFileSync } from "node:fs";
import { authors, seedArticles } from "../src/lib/seed.ts";
const quote = (value: unknown): string => {
  if (typeof value === "number") return String(value);
  if (Array.isArray(value))
    return `ARRAY[${value.map(quote).join(",")}]::text[]`;
  return `'${String(value).replaceAll("'", "''")}'`;
};
let sql =
  "-- Generated sample content. Historical views/likes are demonstration seed metrics.\n-- Safe to rerun: existing records are retained.\nbegin;\n";
for (const [table, rows] of [
  ["profiles", authors],
  ["articles", seedArticles],
] as const) {
  for (const row of rows)
    sql += `insert into public.${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(quote).join(",")}) on conflict(id) do nothing;\n`;
}
sql += "commit;\n";
writeFileSync("supabase/002_seed.sql", sql);
console.log(
  `Generated ${authors.length} profiles and ${seedArticles.length} articles.`,
);
