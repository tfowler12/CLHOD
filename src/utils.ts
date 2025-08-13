import { useState, useEffect } from "react";
import { DirectoryRecord } from "./types";

export const REGION_KEYS = ["South", "Southeast", "Midwest", "Northeast", "Pacific"] as const;
export const REGION_COLORS: Record<string, string> = {
  South: "#7FC5E4",
  Southeast: "#F26C6C",
  Northeast: "#CCED7B",
  Midwest: "#63BEB1",
  Pacific: "#F7AF6D",
};

export const truthyFlag = (v?: string) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["y", "yes", "true", "1", "✓", "x"].includes(s);
};

export const deriveRegions = (r: DirectoryRecord) =>
  REGION_KEYS.filter((k) => truthyFlag(r[k])).map((k) => k);

export const normalize = (s?: string) => (s || "").trim();
export const personId = (r: DirectoryRecord) =>
  normalize(r["Person ID"]) || normalize(r.Email);
export const managerId = (r: DirectoryRecord) =>
  normalize(r["Manager ID"]) || normalize(r["Manager Email"]);
export const sortOrderNum = (r: DirectoryRecord) => {
  const v =
    (typeof r["Sort Order"] === "string"
      ? Number(r["Sort Order"])
      : (r["Sort Order"] as number)) || 0;
  return Number.isFinite(v) ? v : 0;
};
export const mailto = (v?: string) => (v ? `mailto:${v}` : undefined);
export const telLink = (v?: string) =>
  v ? `tel:${(v || "").replace(/[^+\d]/g, "")}` : undefined;

export function isNonValue(v?: string) {
  if (!v) return true;
  const s = String(v).trim();
  if (s === "") return true;
  return /^(false|no|n|0|na|n\/a|n\.?a\.?|none|tbd|to be determined|\-|--)$/i.test(s);
}
export function show(v?: string) {
  return !isNonValue(v);
}

export function sameRecord(a?: DirectoryRecord | null, b?: DirectoryRecord | null) {
  if (!a || !b) return false;
  const aKey = `${a.Name || ""}|${a.Email || ""}|${a.Title || ""}`;
  const bKey = `${b.Name || ""}|${b.Email || ""}|${b.Title || ""}`;
  return aKey === bKey;
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export function trimAll<T extends Record<string, any>>(obj: T): T {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    const v = out[k as keyof T];
    if (typeof v === "string") out[k as keyof T] = v.trim() as any;
  });
  return out;
}

export function hierarchyClasses(depth: number): string {
  if (depth === 0)
    return "bg-[#7FC5E4] text-[#092C48] border-[#19557F]";
  if (depth === 1)
    return "bg-[#C3CFDA] text-[#344A5B] border-[#778EA0]";
  if (depth === 2)
    return "bg-[#F0F7DC] text-[#74922C] border-[#CCED7B]";
  return "bg-white text-slate-900 border-[#C3CFDA]";
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : true
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop("matches" in e ? e.matches : (e as MediaQueryList).matches);
    setIsDesktop(mq.matches);
    if ((mq as any).addEventListener)
      mq.addEventListener("change", handler as any);
    else (mq as any).addListener(handler as any);
    return () => {
      if ((mq as any).removeEventListener)
        mq.removeEventListener("change", handler as any);
      else (mq as any).removeListener(handler as any);
    };
  }, []);
  return isDesktop;
}
