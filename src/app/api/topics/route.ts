import { getPublicTopics } from "@/lib/public-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getPublicTopics(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "知识地图暂时无法加载，请稍后重试。" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
