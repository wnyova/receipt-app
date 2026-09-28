import { useEffect, useState } from "react";
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    let message = "Terjadi kesalahan. Coba kembali.";
    try {
      message = (await response.json()).error || message;
    } catch {}
    throw new Error(message);
  }
  const result = await response.json();
  if (path === "/settings" && options.method === "PUT")
    window.dispatchEvent(new Event("receipt-settings-updated"));
  return result;
}
export const write = <T = any>(path: string, body: unknown, method = "POST") =>
  api<T>(path, { method, body: JSON.stringify(body) });
export function useData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (path !== "/settings") return;
    const refresh = () => setRevision((r) => r + 1);
    window.addEventListener("receipt-settings-updated", refresh);
    return () =>
      window.removeEventListener("receipt-settings-updated", refresh);
  }, [path]);
  useEffect(() => {
    let alive = true;
    setError("");
    api<T>(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [path, revision]);
  return { data, error, reload: () => setRevision((r) => r + 1), setData };
}
export async function upload(file: File, kind = "logos") {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Maksimal ukuran gambar 5 MB.");
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  return (await api<{ url: string }>("/uploads", { method: "POST", body })).url;
}
