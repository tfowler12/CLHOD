import React from "react";
import { REGION_COLORS } from "@/utils";

export function RegionPill({ name }: { name: string }) {
  const color = REGION_COLORS[name] || "#5B7183";
  const style: React.CSSProperties = { color, borderColor: color, borderWidth: 1 };
  return (
    <span
      aria-label={`Region ${name}`}
      className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white border"
      style={style}
    >
      {name}
    </span>
  );
}
