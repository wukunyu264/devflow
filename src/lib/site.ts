export const siteUrl = new URL(process.env.SITE_URL || "https://boisterous-cascaron-44d48a.netlify.app");
export const absoluteUrl = (path: string) => new URL(path, siteUrl).href;
