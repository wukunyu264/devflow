"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
export function CommunityProvider({
  initial,
  children,
}: {
  initial: Community;
  children: ReactNode;
}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const refresh = useCallback(async () => {
    const response = await fetch("/api/community", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "加载失败");
    setData(result);
  }, []);
  useEffect(() => {
    refresh()
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
    const preference = localStorage.getItem("devflow-theme");
    const isDark = preference
      ? preference === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [refresh]);
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
    setDark(next);
    localStorage.setItem("devflow-theme", next ? "dark" : "light");
    document.documentElement.dataset.theme = next ? "dark" : "light";
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
