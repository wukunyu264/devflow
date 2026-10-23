"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import type { Community } from "@/lib/types";

export async function request(
  action: string,
  payload: Record<string, unknown> = {},
) {
  const response = await fetch("/api/community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(result.error || "网络请求失败，请重试。"), {
      status: response.status,
    });
  return result as {
    success?: boolean;
    id?: string;
    message?: string;
    confirmation?: boolean;
  };
}
type Context = {
  data: Community;
  loading: boolean;
  refresh: () => Promise<void>;
  act: (
    action: string,
    payload?: Record<string, unknown>,
    message?: string,
  ) => Promise<boolean>;
  dark: boolean;
  toggleTheme: () => void;
};
const CommunityContext = createContext<Context | null>(null);
function subscribeTheme(callback: () => void) {
  window.addEventListener("devflow-theme", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("devflow-theme", callback); window.removeEventListener("storage", callback); };
}
const themeSnapshot = () => document.documentElement.dataset.theme === "dark";
export function CommunityProvider({
  initial,
  children,
}: {
  initial: Community;
  children: ReactNode;
}) {
  const [data, setData] = useState(initial);
  const loading = false;
  const dark = useSyncExternalStore(subscribeTheme, themeSnapshot, () => false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = pathname.startsWith("/article/") ? pathname.split("/")[2] : pathname === "/write" ? searchParams.get("edit") : null;
  const refresh = useCallback(async () => {
    const response = await fetch("/api/community" + (selectedId ? `?article=${encodeURIComponent(selectedId)}` : ""), { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "加载失败");
    setData(result);
  }, [selectedId]);
  const act = useCallback(
    async (
      action: string,
      payload: Record<string, unknown> = {},
      message?: string,
    ) => {
      try {
        await request(action, payload);
        await refresh();
        if (message) toast.success(message);
        return true;
      } catch (e) {
        const error = e as Error & { status?: number };
        if (error.status === 401) {
          toast("登录后，与你喜欢的内容更近一步");
          router.push(
            `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
          );
        } else toast.error(error.message);
        return false;
      }
    },
    [refresh, router],
  );
  const toggleTheme = () => {
    const next = !dark;
    try { localStorage.setItem("devflow-theme", next ? "dark" : "light"); } catch {}
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    window.dispatchEvent(new Event("devflow-theme"));
  };
  return (
    <CommunityContext.Provider
      value={{ data, loading, refresh, act, dark, toggleTheme }}
    >
      {children}
      <Toaster
        richColors
        position="top-center"
        theme={dark ? "dark" : "light"}
        closeButton
      />
    </CommunityContext.Provider>
  );
}
export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error("Missing community provider");
  return value;
}
