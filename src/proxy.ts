import { NextResponse, type NextRequest } from "next/server";
import { validPagePath } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Fast syntax checks only: no cookies, authentication, or database round trips.
  if (pathname === "/_not-found" || validPagePath(pathname.split("/").filter(Boolean)))
    return NextResponse.next();
  const target = request.nextUrl.clone();
  target.pathname = "/_not-found";
  target.search = "";
  // Next 16's runtime notFound() recovery otherwise emits an empty SSR body.
  // Its built-in not-found route prerenders our existing app/not-found.tsx.
  return NextResponse.rewrite(target, {status:404,headers:{"X-Robots-Tag":"noindex", "Cache-Control":"private, no-store"}});
}
export const config = { matcher: ["/((?!api|_next|opengraph-image|.*\\..*).*)"] };
